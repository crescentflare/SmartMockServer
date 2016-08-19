package com.crescentflare.smartmockexample.data;

import com.google.gson.annotations.SerializedName;

/**
 * Data enum: user role
 */
public enum UserRole
{
    @SerializedName("user")
    User,

    @SerializedName("admin")
    Admin;
}
