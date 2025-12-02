<?php

// Include shared routes (public routes and common authenticated routes)
require __DIR__.'/roles/shared.php';

// Include role-specific route files
require __DIR__.'/roles/admin.php';
require __DIR__.'/roles/manager.php';
require __DIR__.'/roles/compliance.php';
require __DIR__.'/roles/audit.php';
require __DIR__.'/roles/user.php';
