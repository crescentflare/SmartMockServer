package com.crescentflare.smartmock.responsegenerator;

import android.content.Context;

import com.crescentflare.smartmock.utility.SmartMockFileUtility;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;

/**
 * Smart mock library response generator: find the end point based on the path (with wildcard matching)
 */
public class SmartMockEndPointFinder
{
    /**
     * Private constructor, only static methods allowed
     */

    private SmartMockEndPointFinder()
    {
    }


    /**
     * Utility functions
     */

    public static String findLocation(Context context, String rootPath, String requestPath)
    {
        // Return early if request path is empty
        if (requestPath.isEmpty() || requestPath.equals("/"))
        {
            return rootPath;
        }

        // Determine path to traverse
        if (requestPath.charAt(0) == '/')
        {
            requestPath = requestPath.substring(1);
        }
        if (requestPath.charAt(requestPath.length() - 1) == '/')
        {
            requestPath = requestPath.substring(0, requestPath.length() - 1);
        }
        String[] pathComponents = requestPath.split("/");

        // Start going through the file tree until a path is found
        if (pathComponents.length > 0)
        {
            String checkPath = rootPath;
            for (String pathComponent : pathComponents)
            {
                String[] fileList = SmartMockFileUtility.list(context, checkPath);
                if (stringArrayContains(fileList, pathComponent))
                {
                    checkPath += "/" + pathComponent;
                }
                else if (stringArrayContains(fileList, "any"))
                {
                    checkPath += "/any";
                }
                else
                {
                    return null;
                }
            }
            return checkPath;
        }
        return rootPath;
    }

    private static boolean stringArrayContains(String[] stringArray, String string)
    {
        for (String check : stringArray)
        {
            if (check.equals(string))
            {
                return true;
            }
        }
        return false;
    }
}
