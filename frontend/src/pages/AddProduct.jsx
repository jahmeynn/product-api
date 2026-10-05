import { useState } from "react";
import {
    Link,
    useNavigate,
} from "react-router-dom";

import API from "../api";


function AddProduct() {

    const navigate = useNavigate();


    const [productName, setProductName] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [price, setPrice] =
        useState("");

    const [quantity, setQuantity] =
        useState("");


    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);


    const saveProduct = async (e) => {

        e.preventDefault();

        setMessage("");
        setError("");


        if (!productName.trim()) {

            setError(
                "Product name is required."
            );

            return;
        }


        if (
            price === "" ||
            Number(price) < 0
        ) {

            setError(
                "Price must be 0 or greater."
            );

            return;
        }


        if (
            quantity === "" ||
            !Number.isInteger(
                Number(quantity)
            ) ||
            Number(quantity) < 0
        ) {

            setError(
                "Quantity must be a whole number 0 or greater."
            );

            return;
        }


        setLoading(true);


        try {

            await API.post(
                "/products",
                {
                    product_name:
                        productName.trim(),

                    description:
                        description.trim(),

                    price:
                        Number(price),

                    quantity:
                        Number(quantity),
                }
            );


            setMessage(
                "Product added successfully."
            );


            setTimeout(() => {

                navigate("/products");

            }, 700);


        } catch (err) {

            console.error(
                "ADD PRODUCT ERROR:",
                err
            );


            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Unable to add product."
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="app">

            <header className="header">

                <div>

                    <h1>
                        Product Management System
                    </h1>


                </div>


                <Link
                    to="/products"
                    className="secondary-link"
                >
                    Back to Products
                </Link>

            </header>


            <main className="container">

                <section className="card">

                    <h2>
                        Add Product
                    </h2>


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


                    <form
                        onSubmit={saveProduct}
                    >

                        <div className="form-grid">

                            <div className="form-group">

                                <label>
                                    Product Name
                                </label>

                                <input
                                    type="text"
                                    value={productName}
                                    onChange={(e) =>
                                        setProductName(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter product name"
                                    required
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Price
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={price}
                                    onChange={(e) =>
                                        setPrice(
                                            e.target.value
                                        )
                                    }
                                    placeholder="0.00"
                                    required
                                />

                            </div>


                            <div className="form-group full">

                                <label>
                                    Description
                                </label>

                                <textarea
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter description"
                                    rows="3"
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Quantity
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={quantity}
                                    onChange={(e) =>
                                        setQuantity(
                                            e.target.value
                                        )
                                    }
                                    placeholder="0"
                                    required
                                />

                            </div>

                        </div>


                        <div className="form-buttons">

                            <button
                                type="submit"
                                disabled={loading}
                            >
                                {loading
                                    ? "Saving..."
                                    : "Add Product"}
                            </button>


                            <Link
                                to="/products"
                                className="cancel-link"
                            >
                                Cancel
                            </Link>

                        </div>

                    </form>

                </section>

            </main>

        </div>

    );

}


export default AddProduct;