<?php

defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class ApiController extends Controller
{
    public function __construct()
    {
        parent::__construct();

        $this->call->database();
        $this->call->library('api');
    }


    /* =========================================================
       AUTHENTICATION
       ========================================================= */

    // POST /api/login
    public function login()
    {
        $this->api->require_method('POST');

        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);

        if (!is_array($input)) {
            $input = [];
        }

        $login = trim($input['username'] ?? '');
        $password = $input['password'] ?? '';

        if ($login === '' || $password === '') {
            $this->api->respond_error(
                'Username/email and password are required',
                422
            );
            return;
        }

        /*
         * Login using either:
         * username OR email
         */
        $stmt = $this->db->raw(
            'SELECT id, username, email, password
             FROM users
             WHERE username = ? OR email = ?
             LIMIT 1',
            [
                $login,
                $login
            ]
        );

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            $this->api->respond_error(
                'Invalid username/email or password',
                401
            );
            return;
        }

        /*
         * Check hashed password
         */
        if (!password_verify($password, $user['password'])) {
            $this->api->respond_error(
                'Invalid username/email or password',
                401
            );
            return;
        }

        /*
         * Create JWT access token and refresh token
         */
        $tokens = $this->api->issue_tokens([
            'id' => $user['id']
        ]);

        $this->api->respond([
            'message' => 'Login successful',

            'tokens' => $tokens,

            'user' => [
                'id'       => $user['id'],
                'username' => $user['username'],
                'email'    => $user['email']
            ]
        ]);

        return;
    }


    // POST /api/refresh
    public function refresh()
    {
        $this->api->require_method('POST');

        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);

        if (!is_array($input)) {
            $input = [];
        }

        $refresh_token = $input['refresh_token'] ?? '';

        if ($refresh_token === '') {
            $this->api->respond_error(
                'Refresh token is required',
                422
            );
            return;
        }

        $this->api->refresh_access_token(
            $refresh_token
        );
    }


    // POST /api/logout
    public function logout()
    {
        $this->api->require_method('POST');

        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);

        if (!is_array($input)) {
            $input = [];
        }

        $refresh_token = $input['refresh_token'] ?? '';

        if ($refresh_token !== '') {
            $this->api->revoke_refresh_token(
                $refresh_token
            );
        }

        $this->api->respond([
            'message' => 'Logged out successfully'
        ]);

        return;
    }


    // POST /api/create
    // Register new user
    public function create()
    {
        $this->api->require_method('POST');

        $this->api->rate_limit(
            'register',
            5,
            300
        );

        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);

        if (!is_array($input)) {
            $input = [];
        }

        $username = trim($input['username'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        if (
            $username === '' ||
            $email === '' ||
            $password === ''
        ) {
            $this->api->respond_error(
                'Username, email and password are required',
                422
            );
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->api->respond_error(
                'Invalid email address',
                422
            );
            return;
        }

        if (strlen($password) < 6) {
            $this->api->respond_error(
                'Password must be at least 6 characters',
                422
            );
            return;
        }

        /*
         * Check username
         */
        $stmt = $this->db->raw(
            'SELECT id
             FROM users
             WHERE username = ?
             LIMIT 1',
            [$username]
        );

        if ($stmt->fetch(PDO::FETCH_ASSOC)) {
            $this->api->respond_error(
                'Username already exists',
                409
            );
            return;
        }

        /*
         * Check email
         */
        $stmt = $this->db->raw(
            'SELECT id
             FROM users
             WHERE email = ?
             LIMIT 1',
            [$email]
        );

        if ($stmt->fetch(PDO::FETCH_ASSOC)) {
            $this->api->respond_error(
                'Email already exists',
                409
            );
            return;
        }

        /*
         * Hash password
         */
        $hashed_password = password_hash(
            $password,
            PASSWORD_BCRYPT
        );

        /*
         * Insert user
         */
        $this->db->raw(
            'INSERT INTO users
                (username, email, password, api_token)
             VALUES
                (?, ?, ?, ?)',
            [
                $username,
                $email,
                $hashed_password,
                null
            ]
        );

        $this->api->respond([
            'message' => 'User created successfully',
            'user_id' => $this->db->last_id()
        ], 201);

        return;
    }


    // GET /api/profile
    public function profile()
    {
        $this->api->require_method('GET');

        $auth = $this->api->require_jwt();

        $stmt = $this->db->raw(
            'SELECT id, username, email
             FROM users
             WHERE id = ?
             LIMIT 1',
            [$auth['sub']]
        );

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            $this->api->respond_error(
                'User not found',
                404
            );
            return;
        }

        $this->api->respond($user);
    }


    /* =========================================================
       PRODUCTS
       ========================================================= */

    // GET /api/products
    public function products()
    {
        $this->api->require_method('GET');

        $this->api->require_jwt();

        $products = $this->db
            ->table('products')
            ->order_by('id', 'DESC')
            ->get_all();

        $this->api->respond($products);

        return;
    }


    // GET /api/products/{id}
    public function product($id)
    {
        $this->api->require_method('GET');

        $this->api->require_jwt();

        $product = $this->find_product($id);

        $this->api->respond($product);

        return;
    }


    // POST /api/products
    public function product_create()
    {
        $this->api->require_method('POST');

        $this->api->require_jwt();

        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);

        if (!is_array($input)) {
            $input = [];
        }

        $error = $this->validate_product($input);

        if ($error) {
            $this->api->respond_error(
                $error,
                422
            );
            return;
        }

        $this->db->raw(
            'INSERT INTO products
                (
                    product_name,
                    description,
                    price,
                    quantity,
                    created_at
                )
             VALUES
                (?, ?, ?, ?, NOW())',
            [
                trim($input['product_name']),
                $input['description'] ?? '',
                $input['price'],
                $input['quantity']
            ]
        );

        $product = $this->find_product(
            $this->db->last_id()
        );

        $this->api->respond(
            $product,
            201
        );

        return;
    }


    // PUT /api/products/{id}
    public function product_update($id)
    {
        $this->api->require_method('PUT');

        $this->api->require_jwt();

        $current = $this->find_product($id);

        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);

        if (!is_array($input)) {
            $input = [];
        }

        $data = [
            'product_name' =>
                $input['product_name']
                ?? $current['product_name'],

            'description' =>
                $input['description']
                ?? $current['description'],

            'price' =>
                $input['price']
                ?? $current['price'],

            'quantity' =>
                $input['quantity']
                ?? $current['quantity']
        ];

        $error = $this->validate_product($data);

        if ($error) {
            $this->api->respond_error(
                $error,
                422
            );
            return;
        }

        $this->db->raw(
            'UPDATE products
             SET
                product_name = ?,
                description = ?,
                price = ?,
                quantity = ?
             WHERE id = ?',
            [
                trim($data['product_name']),
                $data['description'],
                $data['price'],
                $data['quantity'],
                $id
            ]
        );

        $product = $this->find_product($id);

        $this->api->respond($product);

        return;
    }


    // PATCH /api/products/{id}
    public function product_patch($id)
    {
        $this->api->require_method('PATCH');

        $this->api->require_jwt();

        $current = $this->find_product($id);

        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);

        if (!is_array($input)) {
            $input = [];
        }

        $data = [
            'product_name' =>
                $input['product_name']
                ?? $current['product_name'],

            'description' =>
                $input['description']
                ?? $current['description'],

            'price' =>
                $input['price']
                ?? $current['price'],

            'quantity' =>
                $input['quantity']
                ?? $current['quantity']
        ];

        $error = $this->validate_product($data);

        if ($error) {
            $this->api->respond_error(
                $error,
                422
            );
            return;
        }

        $this->db->raw(
            'UPDATE products
             SET
                product_name = ?,
                description = ?,
                price = ?,
                quantity = ?
             WHERE id = ?',
            [
                trim($data['product_name']),
                $data['description'],
                $data['price'],
                $data['quantity'],
                $id
            ]
        );

        $this->api->respond(
            $this->find_product($id)
        );

        return;
    }


    // DELETE /api/products/{id}
    public function product_delete($id)
    {
        $this->api->require_method('DELETE');

        $this->api->require_jwt();

        $this->find_product($id);

        $this->db->raw(
            'DELETE FROM products
             WHERE id = ?',
            [$id]
        );

        $this->api->respond([
            'message' => 'Product deleted successfully'
        ]);

        return;
    }


    /* =========================================================
       HELPERS
       ========================================================= */

    private function find_product($id)
    {
        $stmt = $this->db->raw(
            'SELECT *
             FROM products
             WHERE id = ?
             LIMIT 1',
            [$id]
        );

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            $this->api->respond_error(
                'Product not found',
                404
            );
            return null;
        }

        return $row;
    }


    private function validate_product($data)
    {
        /*
         * Product name
         */
        if (
            trim($data['product_name'] ?? '') === '' ||
            strlen($data['product_name']) > 100
        ) {
            return 'Product name is required and must not exceed 100 characters';
        }

        /*
         * Price
         */
        if (
            !isset($data['price']) ||
            !is_numeric($data['price']) ||
            $data['price'] < 0
        ) {
            return 'Price must be a number greater than or equal to 0';
        }

        /*
         * Quantity
         */
        if (
            !isset($data['quantity']) ||
            filter_var(
                $data['quantity'],
                FILTER_VALIDATE_INT
            ) === false ||
            $data['quantity'] < 0
        ) {
            return 'Quantity must be a whole number greater than or equal to 0';
        }

        return null;
    }
}