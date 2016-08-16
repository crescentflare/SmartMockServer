package com.crescentflare.smartmockexample.network;

import com.crescentflare.smartmockexample.data.User;

import retrofit2.Call;
import retrofit2.http.Field;
import retrofit2.http.FormUrlEncoded;
import retrofit2.http.POST;

/**
 * Network service: provides authentication (like logging in and out)
 */
public interface AuthenticationService
{
    /**
     * Log in
     */
    @POST("login")
    @FormUrlEncoded
    Call<User> login(@Field("username") String username, @Field("password") String password);

    /**
     * Log out
     */
    @POST("logout")
    Call<User> logout();
}
