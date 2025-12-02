<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'first_name',
        'middle_initial',
        'last_name',
        'username',
        'email',
        'password',
        'status',
        'profile_pic',
        'branch_id',
        'password_change_required',
        'password_changed_at',
        'last_seen_at',
        'two_factor_enabled',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'password_change_required' => 'boolean',
            'password_changed_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'two_factor_enabled' => 'boolean',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function hasRole(string $role): bool
    {
        return $this->roles()->where('slug', $role)->exists();
    }

    public function hasPermission(string $permission): bool
    {
        return $this->roles()->whereHas('permissions', function ($query) use ($permission) {
            $query->where('slug', $permission);
        })->exists();
    }

    public function getFullNameAttribute(): string
    {
        $name = $this->first_name;
        if ($this->middle_initial) {
            $name .= ' '.$this->middle_initial.'.';
        }
        $name .= ' '.$this->last_name;

        return $name;
    }

    /**
     * Send the password reset notification.
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    /**
     * Check if user's password has expired
     *
     * @return bool
     */
    public function isPasswordExpired(): bool
    {
        try {
            // Admin is never affected by password expiration
            if ($this->hasRole('admin')) {
                return false;
            }

            // Check if system_settings table exists
            if (!\Schema::hasTable('system_settings')) {
                return false;
            }

            // Get password expiration settings
            $expirationEnabled = \DB::table('system_settings')
                ->where('group', 'security')
                ->where('key', 'password_expiration_enabled')
                ->value('value');

            if ($expirationEnabled !== 'true' && $expirationEnabled !== true) {
                return false;
            }

            // Get expiration months
            $expirationMonths = (int) \DB::table('system_settings')
                ->where('group', 'security')
                ->where('key', 'password_expiration_months')
                ->value('value');

            // Get affected roles
            $affectedRolesJson = \DB::table('system_settings')
                ->where('group', 'security')
                ->where('key', 'password_expiration_roles')
                ->value('value');

            $affectedRoles = $affectedRolesJson ? json_decode($affectedRolesJson, true) : [];

            // Check if user has any affected role
            $userRoles = $this->roles->pluck('name')->toArray();
            $hasAffectedRole = !empty(array_intersect($userRoles, $affectedRoles));

            if (!$hasAffectedRole) {
                return false;
            }

            // Check if password_changed_at exists and if it's expired
            if (!$this->password_changed_at) {
                return false;
            }

            $expirationDate = \Carbon\Carbon::parse($this->password_changed_at)->addMonths($expirationMonths);

            return \Carbon\Carbon::now()->greaterThan($expirationDate);
        } catch (\Exception $e) {
            // If any error occurs, return false (password not expired)
            \Log::error('Password expiration check failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get days until password expires (negative if already expired)
     *
     * @return int|null
     */
    public function daysUntilPasswordExpires(): ?int
    {
        try {
            if ($this->hasRole('admin')) {
                return null;
            }

            // Check if system_settings table exists
            if (!\Schema::hasTable('system_settings')) {
                return null;
            }

            $expirationEnabled = \DB::table('system_settings')
                ->where('group', 'security')
                ->where('key', 'password_expiration_enabled')
                ->value('value');

            if ($expirationEnabled !== 'true' && $expirationEnabled !== true) {
                return null;
            }

            $expirationMonths = (int) \DB::table('system_settings')
                ->where('group', 'security')
                ->where('key', 'password_expiration_months')
                ->value('value');

            if (!$this->password_changed_at) {
                return null;
            }

            $expirationDate = \Carbon\Carbon::parse($this->password_changed_at)->addMonths($expirationMonths);

            return \Carbon\Carbon::now()->diffInDays($expirationDate, false);
        } catch (\Exception $e) {
            // If any error occurs, return null
            \Log::error('Password expiration days check failed: ' . $e->getMessage());
            return null;
        }
    }
}
