import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";


function Login() {

    const navigate = useNavigate();

    const [loginValue, setLoginValue] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);


    const login = async (e) => {

        e.preventDefault();

        setMessage("");
        setError("");
        setLoading(true);


        try {

            const response = await API.post(
                "/login",
                {
                    username: loginValue,
                    password: password,
                }
            );


            const accessToken =
                response.data?.tokens?.access_token;

            const refreshToken =
                response.data?.tokens?.refresh_token;

            const loggedUser =
                response.data?.user;


            if (!accessToken) {

                throw new Error(
                    "No access token returned by API."
                );

            }


            localStorage.setItem(
                "access_token",
                accessToken
            );


            if (refreshToken) {

                localStorage.setItem(
                    "refresh_token",
                    refreshToken
                );

            }


            localStorage.setItem(
                "user",
                JSON.stringify(loggedUser)
            );


            setMessage(
                "Login successful!"
            );


            /*
             * Go to Product List
             */

            navigate("/products");

        } catch (err) {

            console.error(
                "LOGIN ERROR:",
                err
            );

            console.error(
                "LOGIN RESPONSE:",
                err.response?.data
            );


            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                err.message ||
                "Login failed."
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="login-page">

            <div className="login-card">

<h1>Log in</h1>



                {message && (

                    <div className="success">
                        {message}
                    </div>

                )}


                {error && (

                    <div className="error">
                        {error}
                    </div>

                )}


                <form onSubmit={login}>

                    <label>
                        Username or Email
                    </label>

                    <input
                        type="text"
                        value={loginValue}
                        onChange={(e) =>
                            setLoginValue(
                                e.target.value
                            )
                        }
                        placeholder="Enter username or email"
                        required
                    />


                    <label>
                        Password
                    </label>

                    <input
                        type="password"
                        value={password}
                        onChange={(e) =>
                            setPassword(
                                e.target.value
                            )
                        }
                        placeholder="Enter password"
                        required
                    />


                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Logging in..."
                            : "Login"}
                    </button>

                </form>

            </div>

        </div>

    );

}


export default Login;