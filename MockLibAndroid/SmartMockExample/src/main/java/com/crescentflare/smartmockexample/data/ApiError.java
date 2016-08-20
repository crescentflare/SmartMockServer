package com.crescentflare.smartmockexample.data;

import com.google.gson.annotations.SerializedName;

/**
 * Data model: an error object with fields being filled by the server in case of an error, used together with ApiException
 */
public class ApiError
{
    /**
     * Members
     */

    @SerializedName("error_message")
    private String message;

    @SerializedName("error_id")
    private String id;

    @SerializedName("error_code")
    private String code;

    @SerializedName("log_entry")
    private String logEntry;


    /**
     * Generated code
     */

    public String getMessage()
    {
        return message;
    }

    public void setMessage(String message)
    {
        this.message = message;
    }

    public String getId()
    {
        return id;
    }

    public void setId(String id)
    {
        this.id = id;
    }

    public String getCode()
    {
        return code;
    }

    public void setCode(String code)
    {
        this.code = code;
    }

    public String getLogEntry()
    {
        return logEntry;
    }

    public void setLogEntry(String logEntry)
    {
        this.logEntry = logEntry;
    }

    @Override
    public String toString()
    {
        return "ApiError{" +
                "message='" + message + '\'' +
                ", id='" + id + '\'' +
                ", code='" + code + '\'' +
                ", logEntry='" + logEntry + '\'' +
                '}';
    }
}
