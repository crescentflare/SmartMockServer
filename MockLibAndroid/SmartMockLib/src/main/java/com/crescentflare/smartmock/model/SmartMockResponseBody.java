package com.crescentflare.smartmock.model;

import android.content.res.AssetManager;

import com.crescentflare.smartmock.utility.SmartMockFileUtility;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;

/**
 * Smart mock library model: a mocked response body to hold large streams or simple strings
 */
public class SmartMockResponseBody
{
    /**
     * Members
     */

    private AssetManager assetManager = null;
    private String stringContent = null;
    private String filePath = null;
    private long contentLength = 0;


    /**
     * Initialization
     */

    private SmartMockResponseBody()
    {
        // Private constructor, use factory methods to create an instance
    }

    public static SmartMockResponseBody createFromString(String body)
    {
        SmartMockResponseBody result = new SmartMockResponseBody();
        result.stringContent = body;
        result.contentLength = body.getBytes().length;
        return result;
    }

    public static SmartMockResponseBody createFromAsset(AssetManager assetManager, String path, long fileLength)
    {
        SmartMockResponseBody result = new SmartMockResponseBody();
        result.assetManager = assetManager;
        result.filePath = path;
        result.contentLength = fileLength;
        return result;
    }

    public static SmartMockResponseBody createFromFile(String path, long fileLength)
    {
        SmartMockResponseBody result = new SmartMockResponseBody();
        result.filePath = path;
        result.contentLength = fileLength;
        return result;
    }


    /**
     * Obtain data in several ways
     */

    public long length()
    {
        return contentLength;
    }

    public String getStringData()
    {
        if (stringContent != null)
        {
            return stringContent;
        }
        else if (assetManager != null)
        {
            try
            {
                return SmartMockFileUtility.readFromInputStream(assetManager.open(filePath));
            }
            catch (IOException ignored)
            {
            }
        }
        else if (filePath != null)
        {
            try
            {
                return SmartMockFileUtility.readFromInputStream(new FileInputStream(filePath));
            }
            catch (FileNotFoundException ignored)
            {
            }
        }
        return "";
    }

    public byte[] getByteData()
    {
        if (stringContent != null)
        {
            try
            {
                return stringContent.getBytes("UTF-8");
            }
            catch (UnsupportedEncodingException ignored)
            {
            }
        }
        else if (assetManager != null || filePath != null)
        {
            try
            {
                InputStream inputStream = getInputStream();
                byte[] result = new byte[(int)contentLength];
                if (inputStream != null)
                {
                    inputStream.read(result);
                    inputStream.close();
                }
                return result;
            }
            catch (IOException ignored)
            {
            }
        }
        return null;
    }

    public InputStream getInputStream()
    {
        if (stringContent != null)
        {
            try
            {
                return new ByteArrayInputStream(stringContent.getBytes("UTF-8"));
            }
            catch (UnsupportedEncodingException ignored)
            {
            }
        }
        else if (assetManager != null)
        {
            try
            {
                return assetManager.open(filePath);
            }
            catch (IOException ignored)
            {
            }
        }
        else if (filePath != null)
        {
            try
            {
                return new FileInputStream(filePath);
            }
            catch (FileNotFoundException ignored)
            {
            }
        }
        return null;
    }
}
