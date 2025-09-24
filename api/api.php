<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");


// Utility: Load JSON
function loadJson($filename) {
    $path = __DIR__ . '/../data/' . $filename;
    if (!file_exists($path)) return [];
    return json_decode(file_get_contents($path), true) ?? [];
}

// Detect which endpoint is requested
$endpoint = $_GET['endpoint'] ?? 'restaurants';

switch ($endpoint) {
    case 'orders':
        handleOrders();
        break;
    default:
        handleRestaurants();
        break;
}

// ------------------- HANDLERS -------------------

function handleRestaurants() {
    $restaurants = loadJson('restaurants.json');

    $search = $_GET['search'] ?? '';
    $sort   = $_GET['sort'] ?? 'name';
    $order  = $_GET['order'] ?? 'asc';
    $page   = (int)($_GET['page'] ?? 1);
    $limit  = (int)($_GET['limit'] ?? 10);

    // Filter
    if ($search) {
        $restaurants = array_filter($restaurants, function($r) use ($search) {
            return stripos($r['name'], $search) !== false ||
                   stripos($r['location'], $search) !== false ||
                   stripos($r['cuisine'], $search) !== false;
        });
    }

    // Sort
    usort($restaurants, function($a, $b) use ($sort, $order) {
        $valA = $a[$sort] ?? '';
        $valB = $b[$sort] ?? '';
        $cmp = strcasecmp($valA, $valB);
        return $order === 'desc' ? -$cmp : $cmp;
    });

    // Pagination
    $total = count($restaurants);
    $offset = ($page - 1) * $limit;
    $restaurants = array_slice($restaurants, $offset, $limit);

    echo json_encode([
        'type' => 'restaurants',
        'data' => array_values($restaurants),
        'meta' => [
            'total' => $total,
            'page'  => $page,
            'limit' => $limit
        ]
    ], JSON_PRETTY_PRINT);
}

function handleOrders() {
    $orders = loadJson('orders.json');

    // Optional filters
    $restaurantId = $_GET['restaurant_id'] ?? null;
    $dateFrom = $_GET['from'] ?? null;
    $dateTo   = $_GET['to'] ?? null;

    $orders = array_filter($orders, function($o) use ($restaurantId, $dateFrom, $dateTo) {
        if ($restaurantId && $o['restaurant_id'] != $restaurantId) return false;
        if ($dateFrom && strtotime($o['order_time']) < strtotime($dateFrom)) return false;
        if ($dateTo && strtotime($o['order_time']) > strtotime($dateTo)) return false;
        return true;
    });

    echo json_encode([
        'type' => 'orders',
        'data' => array_values($orders),
        'meta' => [
            'total' => count($orders)
        ]
    ], JSON_PRETTY_PRINT);
}
