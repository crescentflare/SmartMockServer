package com.crescentflare.smartmock;

import android.content.Context;

import com.crescentflare.smartmock.model.SmartMockResponse;
import com.crescentflare.smartmock.responsegenerator.SmartMockEndPointFinder;
import com.crescentflare.smartmock.responsegenerator.SmartMockResponseFinder;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Map;

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

    public static SmartMockResponse obtainResponse(Context context, String method, String rootPath, String path, String body)
    {
        // Fetch parameters from path
        Map<String, String> parameters = new HashMap<>();
        int paramMark = path.indexOf('?');
        if (paramMark >= 0)
        {
            String[] parameterStrings = path.substring(paramMark + 1).split("&");
            for (String parameterString : parameterStrings)
            {
                String[] parameterPair = parameterString.split("=");
                if (parameterPair.length > 1)
                {
                    try
                    {
                        parameters.put(URLDecoder.decode(parameterPair[0], "UTF-8"), URLDecoder.decode(parameterPair[1], "UTF-8"));
                    }
                    catch (UnsupportedEncodingException ignored)
                    {
                    }
                }
            }
            path = path.substring(0, paramMark);
        }
        if (!path.startsWith("/"))
        {
            path = "/" + path;
        }

        // Find location and generate response
        String filePath = SmartMockEndPointFinder.findLocation(context, rootPath, path);
        return SmartMockResponseFinder.generateResponse(context, null, method, path, filePath, parameters, body);
    }
}
