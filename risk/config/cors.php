<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'https://risk-profiling.rbtbank.com'),
        'https://risk-profiling.rbtbank.com',
        'https://192.168.0.213',
        'http://risk-profiling.rbtbank.com',
        'http://192.168.0.213',
        'http://192.168.0.213:5173',
        'http://localhost:5173',
    ],

    'allowed_origins_patterns' => [
        'https://192.168.*',
        'https://risk-profiling.rbtbank.com*',
        'http://192.168.*',
        'http://localhost:*',
        'http://risk-profiling.rbtbank.com*',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
