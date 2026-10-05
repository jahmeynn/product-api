import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";


function Products() {

    const navigate = useNavigate();

    const [products, setProducts] = useState([]);

    const [user] = useState(
        JSON.parse(
            localStorage.getItem("user") || "null"
        )
    );

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    /*
     * LOAD PRODUCTS
     */

    const loadProducts = async () => {

        try {

            setError("");

            const response =
                await API.get("/products");

            setProducts(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (err) {

            console.error(
                "LOAD PRODUCTS ERROR:",
                err
            );

            if (
                err.response?.status === 401
            ) {

                logout();

                return;
            }

            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Unable to load products."
            );
        }
    };


    /*
     * LOGOUT
     */

    const logout = async () => {

        const refreshToken =
            localStorage.getItem("refresh_token");

        try {

            if (refreshToken) {

                await API.post(
                    "/logout",
                    {
                        refresh_token:
                            refreshToken,
                    }
                );
            }

        } catch (err) {

            console.log(
                "Logout API error:",
                err
            );
        }

        localStorage.removeItem(
            "access_token"
        );

        localStorage.removeItem(
            "refresh_token"
        );

        localStorage.removeItem(
            "user"
        );

        navigate("/login");
    };


    /*
     * DELETE PRODUCT
     */

    const deleteProduct = async (id) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this product?"
            );

        if (!confirmed) {
            return;
        }

        setMessage("");
        setError("");
        setLoading(true);

        try {

            await API.delete(
                `/products/${id}`
            );

            setMessage(
                "Product deleted successfully."
            );

            await loadProducts();

        } catch (err) {

            console.error(
                "DELETE PRODUCT ERROR:",
                err
            );

            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Unable to delete product."
            );

        } finally {

            setLoading(false);
        }
    };


    /*
     * LOAD WHEN PAGE OPENS
     */

    useEffect(() => {

        loadProducts();

    }, []);


    return (

        <div className="dashboard">


            {/* =====================================================
                TOP NAVIGATION
            ===================================================== */}

            <header className="topbar">

                <div className="brand">

                    <div className="brand-logo">
                        PM
                    </div>

                    <div className="brand-text">

                        <h1>
                            Product Management
                        </h1>

                        <span>
                            Inventory System
                        </span>

                    </div>

                </div>


                <div className="topbar-right">

                    <div className="user-info">

                        <div className="user-avatar">
                            {(
                                user?.username ||
                                "U"
                            )
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>

                            <strong>
                                {user?.username || "User"}
                            </strong>

                            <span>
                                Administrator
                            </span>

                        </div>

                    </div>


                    <button
                        className="logout-button"
                        onClick={logout}
                    >
                        Logout
                    </button>

                </div>

            </header>


            {/* =====================================================
                MAIN CONTENT
            ===================================================== */}

            <main className="dashboard-content">


                {/* PAGE TITLE */}

                <div className="page-heading">

                    <div>

                        <span className="eyebrow">
                            INVENTORY MANAGEMENT
                        </span>

                        <h2>
                            Products
                        </h2>

                        <p>
                            Manage your products, prices,
                            descriptions, and stock levels.
                        </p>

                    </div>


                    <Link
                        to="/products/add"
                        className="primary-button"
                    >
                        <span className="button-icon">
                            +
                        </span>

                        Add Product
                    </Link>

                </div>


                {/* =================================================
                    SUMMARY CARDS
                ================================================= */}

                <div className="stats-grid">

                    <div className="stat-card">

                        <div className="stat-icon">
                            📦
                        </div>

                        <div>

                            <span>
                                Total Products
                            </span>

                            <strong>
                                {products.length}
                            </strong>

                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-icon">
                            📊
                        </div>

                        <div>

                            <span>
                                Total Stock
                            </span>

                            <strong>
                                {products.reduce(
                                    (total, product) =>
                                        total +
                                        Number(
                                            product.quantity || 0
                                        ),
                                    0
                                )}
                            </strong>

                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-icon">
                            ₱
                        </div>

                        <div>

                            <span>
                                Inventory Value
                            </span>

                            <strong>

                                ₱
                                {products
                                    .reduce(
                                        (total, product) =>
                                            total +
                                            (
                                                Number(
                                                    product.price || 0
                                                ) *
                                                Number(
                                                    product.quantity || 0
                                                )
                                            ),
                                        0
                                    )
                                    .toLocaleString(
                                        "en-PH",
                                        {
                                            minimumFractionDigits: 2,
                                        }
                                    )}

                            </strong>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    MESSAGES
                ================================================= */}

                {message && (

                    <div className="alert success-alert">

                        <span>
                            ✓
                        </span>

                        {message}

                    </div>

                )}


                {error && (

                    <div className="alert error-alert">

                        <span>
                            !
                        </span>

                        {error}

                    </div>

                )}


                {/* =================================================
                    PRODUCT TABLE
                ================================================= */}

                <section className="inventory-card">


                    <div className="inventory-header">

                        <div>

                            <h3>
                                Product Inventory
                            </h3>

                            <p>
                                {products.length === 1
                                    ? "1 product available"
                                    : `${products.length} products available`}
                            </p>

                        </div>


                        <button
                            className="refresh-button"
                            onClick={loadProducts}
                            disabled={loading}
                        >

                            <span>
                                ↻
                            </span>

                            {loading
                                ? "Refreshing..."
                                : "Refresh"}

                        </button>

                    </div>


                    {products.length === 0 ? (

                        <div className="empty-state">

                            <div className="empty-icon">
                                📦
                            </div>

                            <h3>
                                No Products Found
                            </h3>

                            <p>
                                Start by adding your first
                                product to the inventory.
                            </p>

                            <Link
                                to="/products/add"
                                className="primary-button"
                            >
                                + Add Product
                            </Link>

                        </div>

                    ) : (

                        <div className="table-wrapper">

                            <table className="inventory-table">

                                <thead>

                                    <tr>

                                        <th>
                                            ID
                                        </th>

                                        <th>
                                            PRODUCT
                                        </th>

                                        <th>
                                            DESCRIPTION
                                        </th>

                                        <th>
                                            PRICE
                                        </th>

                                        <th>
                                            STOCK
                                        </th>

                                        <th>
                                            STATUS
                                        </th>

                                        <th>
                                            ACTIONS
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {products.map(
                                        (product) => {

                                            const quantity =
                                                Number(
                                                    product.quantity || 0
                                                );

                                            return (

                                                <tr
                                                    key={
                                                        product.id
                                                    }
                                                >

                                                    {/* ID */}

                                                    <td>

                                                        <span className="product-id">
                                                            #
                                                            {
                                                                product.id
                                                            }
                                                        </span>

                                                    </td>


                                                    {/* PRODUCT */}

                                                    <td>

                                                        <div className="product-cell">

                                                            <div className="product-avatar">
                                                                {(
                                                                    product.product_name ||
                                                                    "P"
                                                                )
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </div>

                                                            <strong>
                                                                {
                                                                    product.product_name
                                                                }
                                                            </strong>

                                                        </div>

                                                    </td>


                                                    {/* DESCRIPTION */}

                                                    <td>

                                                        <span className="description-text">

                                                            {
                                                                product.description ||
                                                                "No description"
                                                            }

                                                        </span>

                                                    </td>


                                                    {/* PRICE */}

                                                    <td>

                                                        <strong className="price">

                                                            ₱
                                                            {Number(
                                                                product.price
                                                            ).toLocaleString(
                                                                "en-PH",
                                                                {
                                                                    minimumFractionDigits:
                                                                        2,
                                                                }
                                                            )}

                                                        </strong>

                                                    </td>


                                                    {/* STOCK */}

                                                    <td>

                                                        <strong>
                                                            {
                                                                quantity
                                                            }
                                                        </strong>

                                                        <span className="stock-label">
                                                            units
                                                        </span>

                                                    </td>


                                                    {/* STATUS */}

                                                    <td>

                                                        {quantity > 0 ? (

                                                            <span className="status-badge in-stock">
                                                                ● In Stock
                                                            </span>

                                                        ) : (

                                                            <span className="status-badge out-stock">
                                                                ● Out of Stock
                                                            </span>

                                                        )}

                                                    </td>


                                                    {/* ACTIONS */}

                                                    <td>

                                                        <div className="action-buttons">

                                                            <Link
                                                                to={`/products/edit/${product.id}`}
                                                                className="edit-button"
                                                            >
                                                                Edit
                                                            </Link>


                                                            <button
                                                                className="delete-button"
                                                                onClick={() =>
                                                                    deleteProduct(
                                                                        product.id
                                                                    )
                                                                }
                                                                disabled={
                                                                    loading
                                                                }
                                                            >
                                                                Delete
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            );
                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>


            </main>

        </div>
    );
}


export default Products;