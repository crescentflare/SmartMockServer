package com.crescentflare.smartmock;

import android.content.Context;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;

/**
 * Smart mock library: the main server interface
 */
public class SmartMockServer
{
    /**
     * Initialization
     */

    private SmartMockServer()
    {
    }


    /**
     * Serve the response
     */

    public static String obtainResponse(Context context, String rootPath, String path)
    {
        rootPath = rootPath.replace("file:///", "");
        try
        {
            InputStream responseStream = context.getAssets().open(rootPath + path + "/responseBody.json");
            if (responseStream != null)
            {
                String result = readFromInputStream(responseStream);
                responseStream.close();
                return result;
            }
        }
        catch (IOException ignored)
        {
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
            return out.toString();
        }
        catch (Exception ignored)
        {
        }
        return null;
    }
}
