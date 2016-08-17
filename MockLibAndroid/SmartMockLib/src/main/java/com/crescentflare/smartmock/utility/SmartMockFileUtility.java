package com.crescentflare.smartmock.utility;

import android.content.Context;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;

/**
 * Smart mock library utility: easily access files with file:/// or assets:/// prefix
 */
public class SmartMockFileUtility
{
    /**
     * Private constructor, only static methods allowed
     */

    private SmartMockFileUtility()
    {
    }


    /**
     * Utility functions
     */

    public static String[] list(Context context, String path)
    {
        if (path.startsWith("assets:///"))
        {
            try
            {
                return context.getAssets().list(path.replace("assets:///", ""));
            }
            catch (IOException ignored)
            {
            }
        }
        else
        {
            return new File(path.replace("file:///", "")).list();
        }
        return null;
    }

    public static InputStream open(Context context, String path)
    {
        if (path.startsWith("assets:///"))
        {
            try
            {
                return context.getAssets().open(path.replace("assets:///", ""));
            }
            catch (IOException ignored)
            {
            }
        }
        else
        {
            try
            {
                new FileInputStream(path.replace("file:///", ""));
            }
            catch (FileNotFoundException ignored)
            {
            }
        }
        return null;
    }

    public static String readFromInputStream(InputStream stream)
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
