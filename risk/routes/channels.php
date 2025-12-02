<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// User-specific private channel for notifications
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Edit requests channel - accessible to managers only
Broadcast::channel('edit-requests', function ($user) {
    return $user->hasRole('manager') || $user->hasRole('admin');
});
