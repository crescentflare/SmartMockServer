package com.crescentflare.smartmock.model;

import org.json.JSONObject;

/**
 * Smart mock library model: a properties model
 */
public class SmartMockProperties
{
    /**
     * Members
     */

    private String method = null;
    private String responsePath = null;
    private String generates = null;
    private int responseCode = -1;


    /**
     * Serialization
     */

    public void parseJson(JSONObject jsonObject)
    {
        method = jsonObject.optString("method");
        responsePath = jsonObject.optString("responsePath");
        generates = jsonObject.optString("generates");
        responseCode = jsonObject.optInt("responseCode", -1);
    }


    /**
     * Helpers
     */

    public void forceDefaults()
    {
        responseCode = responseCode >= 0 ? responseCode : 200;
        responsePath = responsePath != null ? responsePath : "response";
    }


    /**
     * Generated code
     */

    public String getMethod()
    {
        return method;
    }

    public void setMethod(String method)
    {
        this.method = method;
    }

    public String getResponsePath()
    {
        return responsePath;
    }

    public void setResponsePath(String responsePath)
    {
        this.responsePath = responsePath;
    }

    public String getGenerates()
    {
        return generates;
    }

    public void setGenerates(String generates)
    {
        this.generates = generates;
    }

    public int getResponseCode()
    {
        return responseCode;
    }

    public void setResponseCode(int responseCode)
    {
        this.responseCode = responseCode;
    }

    @Override
    public String toString()
    {
        return "SmartMockProperties{" +
                ", method='" + method + '\'' +
                ", responsePath='" + responsePath + '\'' +
                ", generates='" + generates + '\'' +
                ", responseCode=" + responseCode +
                '}';
    }
}
