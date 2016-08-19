package com.crescentflare.smartmockexample.network;

import com.crescentflare.smartmockexample.data.ApiError;

import java.io.IOException;

/**
 * Network exception: an exception which is thrown manually and contains an error object (based on the server error response JSON)
 */
public class ApiException extends IOException
{
    /**
     * Members
     */

    private ApiError error = null;


    /**
     * Initialization
     */

    public ApiException(ApiError error)
    {
        super(getMessage(error));
        this.error = error;
    }

    private static String getMessage(ApiError error)
    {
        if (error != null && error.getMessage() != null)
        {
            return error.getMessage();
        }
        return "No error information from server";
    }


    /**
     * Obtain error
     */

    public ApiError getError()
    {
        return error;
    }
}
