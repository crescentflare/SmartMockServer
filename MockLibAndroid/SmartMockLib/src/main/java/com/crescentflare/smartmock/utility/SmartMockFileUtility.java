package com.crescentflare.smartmock.utility;

import android.content.Context;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;

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
}
