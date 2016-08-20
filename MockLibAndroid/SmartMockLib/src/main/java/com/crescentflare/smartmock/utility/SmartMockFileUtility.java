package com.crescentflare.smartmock.utility;

import android.content.Context;
import android.content.res.AssetFileDescriptor;

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
        if (isAssetFile(path))
        {
            try
            {
                return context.getAssets().list(getRawPath(path));
            }
            catch (IOException ignored)
            {
            }
        }
        else
        {
            return new File(getRawPath(path)).list();
        }
        return null;
    }

    public static InputStream open(Context context, String path)
    {
        if (isAssetFile(path))
        {
            try
            {
                return context.getAssets().open(getRawPath(path));
            }
            catch (IOException ignored)
            {
            }
        }
        else
        {
            try
            {
                new FileInputStream(getRawPath(path));
            }
            catch (FileNotFoundException ignored)
            {
            }
        }
        return null;
    }

    public static long getLength(Context context, String path)
    {
        if (isAssetFile(path))
        {
            try
            {
                AssetFileDescriptor info = context.getAssets().openFd(getRawPath(path));
                return info.getLength();
            }
            catch (IOException ignored)
            {
            }
            try
            {
                InputStream inputStream = context.getAssets().open(getRawPath(path));
                long length = inputStream.available();
                inputStream.close();
                return length;
            }
            catch (IOException ignored)
            {
            }
        }
        else
        {
            File file = new File(getRawPath(path));
            if (file.exists())
            {
                return file.length();
            }
        }
        return -1;
    }

    public static boolean exists(Context context, String path)
    {
        return getLength(context, path) >= 0;
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

    public static boolean isAssetFile(String path)
    {
        return path.startsWith("assets:///");
    }

    public static String getRawPath(String path)
    {
        if (isAssetFile(path))
        {
            return path.replace("assets:///", "");
        }
        return path.replace("file:///", "");
    }
}
