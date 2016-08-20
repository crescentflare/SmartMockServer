package com.crescentflare.smartmock;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;

import com.crescentflare.smartmock.model.SmartMockHeaders;
import com.crescentflare.smartmock.model.SmartMockResponse;
import com.crescentflare.smartmock.responsegenerator.SmartMockEndPointFinder;
import com.crescentflare.smartmock.responsegenerator.SmartMockResponseFinder;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Smart mock library: the main server interface
 */
public class SmartMockServer
{
    /**
     * Singleton instance
     */

    public static final SmartMockServer instance = new SmartMockServer();


    /**
     * Members
     */

    private List<String> cookieValues = new ArrayList<>();
    private boolean cookiesEnabled = false;


    /**
     * Initialization
     */

    public SmartMockServer()
    {
    }


    /**
     * Serve the response
     */

    public void obtainResponse(Context context, final String method, final String rootPath, final String path, final String body, final SmartMockHeaders headers, final SmartMockServerCallback completion)
    {
        if (Looper.myLooper() != Looper.getMainLooper())
        {
            completion.onObtainMockResponse(obtainResponseSync(context, method, rootPath, path, body, headers));
            return;
        }
        final Handler handler = new Handler();
        final Context appContext = context.getApplicationContext();
        Thread thread = new Thread(new Runnable()
        {
            @Override
            public void run()
            {
                final SmartMockResponse response = obtainResponseSync(appContext, method, rootPath, path, body, headers);
                handler.post(new Runnable()
                {
                    @Override
                    public void run()
                    {
                        if (completion != null)
                        {
                            completion.onObtainMockResponse(response);
                        }
                    }
                });
            }
        });
        thread.start();
    }

    public SmartMockResponse obtainResponseSync(Context context, String method, String rootPath, String path, String body, SmartMockHeaders headers)
    {
        // Safety checks
        if (body == null)
        {
            body = "";
        }
        if (headers == null)
        {
            headers = SmartMockHeaders.create(null);
        }

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

        // Add cookies (if enabled)
        if (cookiesEnabled)
        {
            for (String value : cookieValues)
            {
                headers.addHeader("Cookie", value);
            }
        }

        // Find location and generate response
        String filePath = SmartMockEndPointFinder.findLocation(context, rootPath, path);
        if (filePath == null)
        {
            SmartMockResponse response = new SmartMockResponse();
            response.setCode(404);
            response.setMimeType("text/plain");
            response.setStringBody("Request path not found: " + path + " (within: " + rootPath + ")");
            return response;
        }
        SmartMockResponse response = SmartMockResponseFinder.generateResponse(context, headers, method, path, filePath, parameters, body);
        if (cookiesEnabled)
        {
            String cookieValue = response.getHeaders().getHeaderValue("Set-Cookie");
            if (cookieValue != null && cookieValue.length() > 0)
            {
                applyToCookies(cookieValue);
            }
        }
        return response;
    }


    /**
     * Cookie management
     */

    public void enableCookies(boolean enabled)
    {
        cookiesEnabled = enabled;
    }

    public void clearCookies()
    {
        cookieValues.clear();
    }

    private void applyToCookies(String value)
    {
        String[] splitValues = value.split(";");
        for (String splitValue : splitValues)
        {
            String[] valueSet = splitValue.split("=");
            if (valueSet.length > 0)
            {
                int foundAtIndex = -1;
                for (int i = 0; i < cookieValues.size(); i++)
                {
                    String[] checkValueSet = cookieValues.get(i).split("=");
                    if (checkValueSet.length > 0 && checkValueSet[0].equals(valueSet[0]))
                    {
                        foundAtIndex = i;
                        break;
                    }
                }
                if (foundAtIndex >= 0)
                {
                    cookieValues.set(foundAtIndex, splitValue);
                }
                else
                {
                    cookieValues.add(splitValue);
                }
            }
        }
    }


    /**
     * Listener for asynchronous mock server call
     */

    public interface SmartMockServerCallback
    {
        void onObtainMockResponse(SmartMockResponse response);
    }
}
