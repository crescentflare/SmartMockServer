package com.crescentflare.smartmock;

import android.content.Context;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;

/**
 * Smart mock library: a mocked response object
 */
public class SmartMockResponse
{
    /**
     * Members
     */

    private String body = "";


    /**
     * Generated code
     */

    public String getBody()
    {
        return body;
    }

    public void setBody(String body)
    {
        this.body = body;
    }

    @Override
    public String toString()
    {
        return "SmartMockResponse{" +
                "body='" + body + '\'' +
                '}';
    }
}
