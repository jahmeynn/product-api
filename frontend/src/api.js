import axios from "axios";

/*
|--------------------------------------------------------------------------
| API URL
|--------------------------------------------------------------------------
|
| If you are running:
|
| php lava serve
|
| LavaLust normally runs on:
|
| http://localhost:8000
|
| Our API prefix is:
|
| /api
|
*/

const API = axios.create({
    baseURL: "http://localhost:3000/api",

    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});


/*
|--------------------------------------------------------------------------
| REQUEST INTERCEPTOR
|--------------------------------------------------------------------------
|
| Automatically attach JWT access token to every
| protected API request.
|
*/

API.interceptors.request.use(
    (config) => {

        const token =
            localStorage.getItem("access_token");

        if (token) {

            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);


/*
|--------------------------------------------------------------------------
| RESPONSE INTERCEPTOR
|--------------------------------------------------------------------------
|
| If JWT expires or API returns 401,
| let App.jsx handle logout.
|
*/

API.interceptors.response.use(

    (response) => {
        return response;
    },

    (error) => {

        if (error.response?.status === 401) {

            /*
             * Do not immediately delete everything
             * during the login request.
             */

            const requestUrl =
                error.config?.url || "";

            if (!requestUrl.includes("/login")) {

                localStorage.removeItem(
                    "access_token"
                );

                localStorage.removeItem(
                    "refresh_token"
                );

                localStorage.removeItem(
                    "user"
                );
            }
        }

        return Promise.reject(error);
    }
);


export default API;