package com.crescentflare.smartmockexample.network;

import com.crescentflare.smartmockexample.data.ApiError;
import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;

import java.io.IOException;

import okhttp3.Interceptor;
import okhttp3.Response;

/**
 * Network interceptor: checks for invalid responses and parses an error object with more information
 */
public class ApiErrorInterceptor implements Interceptor
{
    @Override
    public Response intercept(Chain chain) throws IOException
    {
        Response response = chain.proceed(chain.request());
        if (response.code() < 200 || response.code() >= 400)
        {
            ApiError error = null;
            try
            {
                error = new Gson().fromJson(response.body().string(), ApiError.class);
            }
            catch (JsonSyntaxException ignored)
            {
            }
            throw new ApiException(error);
        }
        return response;
    }
}
