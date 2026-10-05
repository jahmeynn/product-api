import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";

import "./App.css";


function ProtectedRoute({ children }) {

    const token =
        localStorage.getItem("access_token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
}


function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* LOGIN */}

                <Route
                    path="/login"
                    element={<Login />}
                />


                {/* PRODUCT LIST */}

                <Route
                    path="/products"
                    element={
                        <ProtectedRoute>
                            <Products />
                        </ProtectedRoute>
                    }
                />


                {/* ADD PRODUCT */}

                <Route
                    path="/products/add"
                    element={
                        <ProtectedRoute>
                            <AddProduct />
                        </ProtectedRoute>
                    }
                />


                {/* EDIT PRODUCT */}

                <Route
                    path="/products/edit/:id"
                    element={
                        <ProtectedRoute>
                            <EditProduct />
                        </ProtectedRoute>
                    }
                />


                {/* DEFAULT */}

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/products"
                            replace
                        />
                    }
                />


                {/* UNKNOWN PAGE */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/products"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>

    );
}


export default App;