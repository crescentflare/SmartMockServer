package com.crescentflare.smartmock.responsegenerator;

import android.content.Context;

import com.crescentflare.smartmock.utility.SmartMockFileUtility;

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
            for (int i = 0; i < pathComponents.length; i++)
            {
                String pathComponent = pathComponents[i];
                String[] fileList = SmartMockFileUtility.list(context, checkPath);
                if (stringArrayContains(fileList, pathComponent))
                {
                    boolean isFile = false;
                    if (i + 1 == pathComponents.length)
                    {
                        isFile = SmartMockFileUtility.getLength(context, checkPath + "/" + pathComponent) > 0;
                    }
                    if (!isFile)
                    {
                        checkPath += "/" + pathComponent;
                    }
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
