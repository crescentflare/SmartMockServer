package com.crescentflare.smartmock.model;

import java.util.HashMap;
import java.util.Map;

/**
 * Smart mock library: a mocked response object
 */
public class SmartMockResponse
{
    /**
     * Members
     */

    private Map<String, String> headers = new HashMap<>();
    private String body = "";
    private String mimeType = "";
    private int code = 0;


    /**
     * Generated code
     */

    public Map<String, String> getHeaders()
    {
        return headers;
    }

    public void setHeaders(Map<String, String> headers)
    {
        this.headers = headers;
    }

    public String getBody()
    {
        return body;
    }

    public void setBody(String body)
    {
        this.body = body;
    }

    public String getMimeType()
    {
        return mimeType;
    }

    public void setMimeType(String mimeType)
    {
        this.mimeType = mimeType;
        if (mimeType.length() > 0)
        {
            headers.put("Content-Type", mimeType);
        }
        else
        {
            headers.remove("Content-Type");
        }
    }

    public int getCode()
    {
        return code;
    }

    public void setCode(int code)
    {
        this.code = code;
    }

    @Override
    public String toString()
    {
        return "SmartMockResponse{" +
                "headers=" + headers +
                ", body='" + body + '\'' +
                ", mimeType='" + mimeType + '\'' +
                ", code=" + code +
                '}';
    }
}
