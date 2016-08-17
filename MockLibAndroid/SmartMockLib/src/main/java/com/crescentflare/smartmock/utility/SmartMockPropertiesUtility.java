package com.crescentflare.smartmock.utility;

import android.content.Context;

import com.crescentflare.smartmock.model.SmartMockProperties;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;

/**
 * Smart mock library utility: easily read and manage response properties
 */
public class SmartMockPropertiesUtility
{
    /**
     * Private constructor, only static methods allowed
     */

    private SmartMockPropertiesUtility()
    {
    }


    /**
     * Utility functions
     */

    public static SmartMockProperties readFile(Context context, String requestPath, String filePath)
    {
        SmartMockProperties properties = null;
        InputStream responseStream = SmartMockFileUtility.open(context, filePath + "/properties.json");
        if (responseStream != null)
        {
            String result = SmartMockFileUtility.readFromInputStream(responseStream);
            if (result != null)
            {
                try
                {
                    JSONObject propertiesJson = new JSONObject(result);
                    properties = new SmartMockProperties();
                    properties.parseJson(propertiesJson);
                }
                catch (JSONException ignored)
                {
                }
            }
        }
        if (properties == null)
        {
            properties = new SmartMockProperties();
        }
        properties.forceDefaults();
        return properties;
    }
}
