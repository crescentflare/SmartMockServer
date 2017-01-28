package com.crescentflare.smartmock.responsegenerator;

import android.content.Context;

import com.crescentflare.smartmock.utility.SmartMockFileUtility;

import org.json.JSONException;
import org.json.JSONObject;

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

    private static String findFileServerPath(Context context, String path)
    {
        int slashIndex = path.lastIndexOf('/');
        while (slashIndex >= 0)
        {
            path = path.substring(0, slashIndex);
            InputStream inputStream = SmartMockFileUtility.open(context, path + "/properties.json");
            if (inputStream != null)
            {
                String jsonString = SmartMockFileUtility.readFromInputStream(inputStream);
                JSONObject jsonObject = new JSONObject();
                try
                {
                    jsonObject = new JSONObject(jsonString);
                }
                catch (JSONException ignored)
                {
                }
                String generates = jsonObject.optString("generates", "");
                if (generates.equals("fileList"))
                {
                    return path;
                }
            }
            if (path.endsWith("//"))
            {
                break;
            }
            slashIndex = path.lastIndexOf('/');
        }
        return null;
    }

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
                    checkPath += "/" + pathComponent;
                    if (isFile)
                    {
                        String fileServerPath = findFileServerPath(context, checkPath);
                        if (fileServerPath != null)
                        {
                            checkPath = fileServerPath;
                        }
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
