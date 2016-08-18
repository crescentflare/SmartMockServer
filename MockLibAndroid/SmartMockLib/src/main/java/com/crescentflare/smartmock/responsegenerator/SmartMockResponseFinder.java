package com.crescentflare.smartmock.responsegenerator;

import android.content.Context;
import android.os.Looper;

import com.crescentflare.smartmock.model.SmartMockProperties;
import com.crescentflare.smartmock.model.SmartMockResponse;
import com.crescentflare.smartmock.utility.SmartMockFileUtility;
import com.crescentflare.smartmock.utility.SmartMockParamMatcher;
import com.crescentflare.smartmock.utility.SmartMockPropertiesUtility;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.Iterator;
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
     * Main utility functions
     */

    public static SmartMockResponse generateResponse(Context context, Map<String, String> headers, String method, String requestPath, String filePath, Map<String, String> getParameters, String body)
    {
        // Convert POST data or header overrides in get parameter list
        if (getParameters.containsKey("methodOverride"))
        {
            method = getParameters.get("methodOverride");
            getParameters.remove("methodOverride");
        }
        if (getParameters.containsKey("postBodyOverride"))
        {
            body = getParameters.get("postBodyOverride");
            getParameters.remove("postBodyOverride");
        }
        if (getParameters.containsKey("headerOverride"))
        {
            JSONObject addHeaders = new JSONObject();
            try
            {
                addHeaders = new JSONObject(getParameters.get("headerOverride"));
            }
            catch (JSONException ignored)
            {
            }
            Iterator<String> headerKeys = addHeaders.keys();
            while (headerKeys.hasNext())
            {
                String headerKey = headerKeys.next();
                headers.put(headerKey, addHeaders.optString(headerKey, ""));
            }
            getParameters.remove("headerOverride");
        }
        if (getParameters.containsKey("getAsPostParameters"))
        {
            String paramBody = "";
            for (String parameter : getParameters.keySet())
            {
                if (!parameter.equals("getAsPostParameters"))
                {
                    try
                    {
                        String paramSet = URLEncoder.encode(parameter, "UTF-8") + "=" + URLEncoder.encode(getParameters.get(parameter), "UTF-8");
                        if (!paramBody.isEmpty())
                        {
                            paramBody += "&";
                        }
                        paramBody += paramSet;
                    }
                    catch (UnsupportedEncodingException ignored)
                    {
                    }
                }
            }
            body = paramBody;
            getParameters = new HashMap<>();
        }
        method = method.toUpperCase();

        // Obtain properties and continue
        SmartMockProperties properties = SmartMockPropertiesUtility.readFile(context, requestPath, filePath);
        SmartMockProperties useProperties = matchAlternativeProperties(properties, method, getParameters, body, headers);
        if (useProperties.getMethod() != null && !method.equals(useProperties.getMethod().toUpperCase()))
        {
            SmartMockResponse response = new SmartMockResponse();
            response.setCode(409);
            response.setMimeType("text/plain");
            response.setBody("Requested method of " + method + " doesn't match required " + useProperties.getMethod().toUpperCase());
            return response;
        }
        if (useProperties.getDelay() > 0 && Looper.myLooper() != Looper.getMainLooper())
        {
            try
            {
                Thread.sleep(useProperties.getDelay());
            }
            catch (InterruptedException ignored)
            {
            }
        }
        return collectResponse(context, filePath, useProperties);
    }

    private static SmartMockResponse collectResponse(Context context, String filePath, SmartMockProperties properties)
    {
        // First collect headers to return
        Map<String, String> returnHeaders = new HashMap<>();
        String[] files = SmartMockFileUtility.list(context, filePath);
        if (files == null)
        {
            files = new String[0];
        }
        String foundFile = fileArraySearch(files, properties.getResponsePath() + "Headers.json", "responseHeaders.json", null, null);
        if (foundFile != null)
        {
            InputStream inputStream = SmartMockFileUtility.open(context, filePath + "/" + foundFile);
            if (inputStream != null)
            {
                String fileContent = SmartMockFileUtility.readFromInputStream(inputStream);
                if (fileContent != null)
                {
                    try
                    {
                        JSONObject headersJson = new JSONObject(fileContent);
                        Iterator<String> keys = headersJson.keys();
                        while (keys.hasNext())
                        {
                            String key = keys.next();
                            returnHeaders.put(key, headersJson.optString(key, ""));
                        }
                    }
                    catch (JSONException ignored)
                    {
                    }
                }
            }
        }

        // Check for response generators, they are not supported
        if (properties.getGenerates() != null && (properties.getGenerates().equals("indexPage") || properties.getGenerates().equals("fileList")))
        {
            SmartMockResponse response = new SmartMockResponse();
            response.setCode(500);
            response.setMimeType("text/plain");
            response.setBody("Response generators not supported in app libraries");
            return response;
        }

        // Check for executable javascript, this is not supported
        String foundJavascriptFile = fileArraySearch(files, properties.getResponsePath() + "Body.js", properties.getResponsePath() + ".js", "responseBody.js", "response.js");
        if (foundJavascriptFile != null)
        {
            SmartMockResponse response = new SmartMockResponse();
            response.setCode(500);
            response.setMimeType("text/plain");
            response.setBody("Executable javascript not supported in app libraries");
            return response;
        }

        // Check for JSON
        String foundJsonFile = fileArraySearch(files, properties.getResponsePath() + "Body.json", properties.getResponsePath() + ".json", "responseBody.json", "response.json");
        if (foundJsonFile != null)
        {
            return responseFromFile(context, "application/json", filePath + "/" + foundJsonFile, properties.getResponseCode(), returnHeaders);
        }

        // Check for HTML
        String foundHtmlFile = fileArraySearch(files, properties.getResponsePath() + "Body.html", properties.getResponsePath() + ".html", "responseBody.html", "response.html");
        if (foundHtmlFile != null)
        {
            return responseFromFile(context, "text/html", filePath + "/" + foundHtmlFile, properties.getResponseCode(), returnHeaders);
        }

        // Check for plain text
        String foundTextFile = fileArraySearch(files, properties.getResponsePath() + "Body.txt", properties.getResponsePath() + ".txt", "responseBody.txt", "response.txt");
        if (foundTextFile != null)
        {
            return responseFromFile(context, "text/plain", filePath + "/" + foundTextFile, properties.getResponseCode(), returnHeaders);
        }

        // Nothing found, return a not supported message
        SmartMockResponse response = new SmartMockResponse();
        response.setCode(500);
        response.setMimeType("text/plain");
        response.setBody("Couldn't find response. Only the following formats are supported: JSON, HTML and text");
        return response;
    }


    /**
     * Property matching
     */

    private static SmartMockProperties matchAlternativeProperties(SmartMockProperties properties, String method, Map<String, String> getParameters, String body, Map<String, String> headers)
    {
        if (properties.getAlternatives() != null)
        {
            for (int i = 0; i < properties.getAlternatives().size(); i++)
            {
                // First pass: match method
                SmartMockProperties alternative = properties.getAlternatives().get(i);
                if (alternative.getMethod() == null)
                {
                    alternative.setMethod(properties.getMethod());
                }
                if (alternative.getMethod() != null && !alternative.getMethod().toUpperCase().equals(method))
                {
                    continue;
                }

                // Second pass: GET parameters
                if (alternative.getGetParameters() != null)
                {
                    boolean foundAlternative = true;
                    for (String key : alternative.getGetParameters().keySet())
                    {
                        if (!SmartMockParamMatcher.paramEquals(alternative.getGetParameters().get(key), getParameters.get(key)))
                        {
                            foundAlternative = false;
                            break;
                        }
                    }
                    if (!foundAlternative)
                    {
                        continue;
                    }
                }

                // Third pass: POST parameters
                if (alternative.getPostParameters() != null)
                {
                    Map<String, String> postParameters = new HashMap<>();
                    String[] bodySplit = body.split("&");
                    for (int j = 0; j < bodySplit.length; j++)
                    {
                        String[] bodyParamSplit = bodySplit[j].split("=");
                        if (bodyParamSplit.length == 2)
                        {
                            try
                            {
                                postParameters.put(URLDecoder.decode(bodyParamSplit[0].trim(), "UTF-8"), URLDecoder.decode(bodyParamSplit[1].trim(), "UTF-8"));
                            }
                            catch (UnsupportedEncodingException ignored)
                            {
                            }
                        }
                    }
                    boolean foundAlternative = true;
                    for (String key : alternative.getPostParameters().keySet())
                    {
                        if (!SmartMockParamMatcher.paramEquals(alternative.getPostParameters().get(key), postParameters.get(key)))
                        {
                            foundAlternative = false;
                            break;
                        }
                    }
                    if (!foundAlternative)
                    {
                        continue;
                    }
                }

                // Fourth pass: POST JSON
                if (alternative.getPostJson() != null)
                {
                    JSONObject bodyJson = null;
                    try
                    {
                        bodyJson = new JSONObject(body);
                    }
                    catch (JSONException ignored)
                    {
                    }
                    if (bodyJson == null || !SmartMockParamMatcher.deepEquals(alternative.getPostJson(), bodyJson))
                    {
                        continue;
                    }
                }

                // Fifth pass: headers
                if (alternative.getCheckHeaders() != null)
                {
                    boolean foundAlternative = true;
                    for (String key : alternative.getCheckHeaders().keySet())
                    {
                        String haveHeader = null;
                        for (String haveKey : headers.keySet())
                        {
                            if (haveKey.equalsIgnoreCase(key))
                            {
                                haveHeader = headers.get(haveKey);
                                break;
                            }
                        }
                        if (!SmartMockParamMatcher.paramEquals(alternative.getCheckHeaders().get(key), haveHeader))
                        {
                            foundAlternative = false;
                            break;
                        }
                    }
                    if (!foundAlternative)
                    {
                        continue;
                    }
                }

                // All passes OK, use alternative
                if (alternative.getResponseCode() < 0)
                {
                    alternative.setResponseCode(properties.getResponseCode());
                }
                if (alternative.getDelay() < 0)
                {
                    alternative.setDelay(properties.getDelay());
                }
                if (alternative.getResponsePath() == null)
                {
                    if (alternative.getName() != null)
                    {
                        alternative.setResponsePath("alternative" + alternative.getName());
                    }
                    else
                    {
                        alternative.setResponsePath("alternative" + i);
                    }
                }
                return alternative;
            }
        }
        return properties;
    }


    /**
     * Helpers
     */

    private static SmartMockResponse responseFromFile(Context context, String contentType, String filePath, int responseCode, Map<String, String> headers)
    {
        InputStream responseStream = SmartMockFileUtility.open(context, filePath);
        if (responseStream != null)
        {
            String result = SmartMockFileUtility.readFromInputStream(responseStream);
            if (result != null)
            {
                if (contentType.equals("application/json"))
                {
                    int exceptionCount = 0;
                    try
                    {
                        new JSONObject(result);
                    }
                    catch (JSONException e)
                    {
                        exceptionCount++;
                    }
                    if (exceptionCount > 0)
                    {
                        try
                        {
                            new JSONArray(result);
                        }
                        catch (JSONException e)
                        {
                            exceptionCount++;
                        }
                    }
                    if (exceptionCount >= 2)
                    {
                        SmartMockResponse response = new SmartMockResponse();
                        response.setCode(500);
                        response.setMimeType("text/plain");
                        response.setBody("Couldn't parse JSON of file: " + filePath);
                        return response;
                    }
                }
                SmartMockResponse response = new SmartMockResponse();
                response.setCode(responseCode);
                response.setMimeType(contentType);
                response.getHeaders().putAll(headers);
                response.setBody(result);
                return response;
            }
        }
        SmartMockResponse response = new SmartMockResponse();
        response.setCode(500);
        response.setMimeType("text/plain");
        response.setBody("Couldn't read file: " + filePath);
        return response;
    }

    private static String fileArraySearch(String[] stringArray, String element, String alt1, String alt2, String alt3)
    {
        for (String check : stringArray)
        {
            if (check.equals(element) || (alt1 != null && check.equals(alt1)) || (alt2 != null && check.equals(alt2)) || (alt3 != null && check.equals(alt3)))
            {
                return check;
            }
        }
        return null;
    }
}
