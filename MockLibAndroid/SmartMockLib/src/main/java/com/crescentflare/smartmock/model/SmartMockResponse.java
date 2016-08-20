package com.crescentflare.smartmock.model;

/**
 * Smart mock library model: a mocked response object
 */
public class SmartMockResponse
{
    /**
     * Members
     */

    private SmartMockHeaders headers = SmartMockHeaders.create(null);
    private SmartMockResponseBody body = SmartMockResponseBody.createFromString("");
    private String mimeType = "";
    private int code = 0;


    /**
     * Helpers
     */

    public void setStringBody(String body)
    {
        this.body = SmartMockResponseBody.createFromString(body);
    }


    /**
     * Generated code
     */

    public SmartMockHeaders getHeaders()
    {
        return headers;
    }

    public void setHeaders(SmartMockHeaders headers)
    {
        this.headers = headers;
    }

    public SmartMockResponseBody getBody()
    {
        return body;
    }

    public void setBody(SmartMockResponseBody body)
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
            headers.setHeader("Content-Type", mimeType);
        }
        else
        {
            headers.removeHeader("Content-Type");
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
