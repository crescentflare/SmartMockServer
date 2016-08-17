package com.crescentflare.smartmock.responsegenerator;

import android.content.Context;

import com.crescentflare.smartmock.SmartMockResponse;
import com.crescentflare.smartmock.utility.SmartMockFileUtility;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.Map;

/**
 * Smart mock library response generator: find the response at the given path with filtering
 */
public class SmartMockResponseFinder
{
    /**
     * Private constructor, only static methods allowed
     */

    private SmartMockResponseFinder()
    {
    }


    /**
     * Utility functions
     */

    public static SmartMockResponse generateResponse(Context context, Map<String, String> headers, String method, String requestPath, String filePath, Map<String, String> getParameters, String body)
    {
        InputStream responseStream = SmartMockFileUtility.open(context, filePath + "/responseBody.json");
        if (responseStream != null)
        {
            String result = readFromInputStream(responseStream);
            SmartMockResponse response = new SmartMockResponse();
            response.setBody(result);
            return response;
        }
        return null;
    }


    /**
     * Helpers
     */

    private static String readFromInputStream(InputStream stream)
    {
        final int bufferSize = 1024;
        final char[] buffer = new char[bufferSize];
        final StringBuilder out = new StringBuilder();
        String result = null;
        try
        {
            Reader in = new InputStreamReader(stream, "UTF-8");
            for ( ; ; )
            {
                int rsz = in.read(buffer, 0, buffer.length);
                if (rsz < 0)
                {
                    break;
                }
                out.append(buffer, 0, rsz);
            }
            result = out.toString();
            stream.close();
        }
        catch (Exception ignored)
        {
        }
        return result;
    }
}
