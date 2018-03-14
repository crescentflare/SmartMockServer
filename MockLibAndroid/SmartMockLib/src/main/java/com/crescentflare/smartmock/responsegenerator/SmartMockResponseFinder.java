package com.crescentflare.smartmock.responsegenerator;

import android.content.Context;
import android.os.Looper;
import android.text.TextUtils;

import com.crescentflare.smartmock.model.SmartMockHeaders;
import com.crescentflare.smartmock.model.SmartMockProperties;
import com.crescentflare.smartmock.model.SmartMockResponse;
import com.crescentflare.smartmock.model.SmartMockResponseBody;
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
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
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

    public static SmartMockResponse generateResponse(Context context, SmartMockHeaders headers, String method, String requestPath, String filePath, Map<String, String> getParameters, String body)
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
                headers.addHeader(headerKey, addHeaders.optString(headerKey, ""));
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
            response.setStringBody("Requested method of " + method + " doesn't match required " + useProperties.getMethod().toUpperCase());
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
        if (properties.getRedirect() != null)
        {
            requestPath += "/" + properties.getRedirect();
            filePath += "/" + properties.getRedirect();
        }
        return collectResponse(context, requestPath, filePath, getParameters, useProperties);
    }

    private static SmartMockResponse collectResponse(Context context, String requestPath, String filePath, Map<String, String> getParameters, SmartMockProperties properties)
    {
        // First collect headers to return
        SmartMockHeaders returnHeaders = SmartMockHeaders.create(null);
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
                            returnHeaders.addHeader(key, headersJson.optString(key, ""));
                        }
                    }
                    catch (JSONException ignored)
                    {
                    }
                }
            }
        }

        // Check for response generators, they are not supported (except for a file within the file list)
        if (properties.getGenerates() != null && (properties.getGenerates().equals("indexPage") || properties.getGenerates().equals("fileList")))
        {
            if (properties.getGenerates().equals("fileList"))
            {
                SmartMockResponse fileResponse = responseFromFileGenerator(context, requestPath, filePath, getParameters, properties);
                if (fileResponse != null)
                {
                    return fileResponse;
                }
            }
            SmartMockResponse response = new SmartMockResponse();
            response.setCode(500);
            response.setMimeType("text/plain");
            response.setStringBody("Response generators not supported in app libraries");
            return response;
        }

        // Check for executable javascript, this is not supported
        String foundJavascriptFile = fileArraySearch(files, properties.getResponsePath() + "Body.js", properties.getResponsePath() + ".js", "responseBody.js", "response.js");
        if (foundJavascriptFile != null)
        {
            SmartMockResponse response = new SmartMockResponse();
            response.setCode(500);
            response.setMimeType("text/plain");
            response.setStringBody("Executable javascript not supported in app libraries");
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
        response.setStringBody("Couldn't find response. Only the following formats are supported: JSON, HTML and text");
        return response;
    }


    /**
     * Property matching
     */

    private static SmartMockProperties matchAlternativeProperties(SmartMockProperties properties, String method, Map<String, String> getParameters, String body, SmartMockHeaders headers)
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
                        if (!SmartMockParamMatcher.paramEquals(alternative.getCheckHeaders().get(key), headers.getHeaderValue(key)))
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

    private static SmartMockResponse responseFromFile(Context context, String contentType, String filePath, int responseCode, SmartMockHeaders headers)
    {
        long fileLength = SmartMockFileUtility.getLength(context, filePath);
        if (fileLength < 0)
        {
            SmartMockResponse response = new SmartMockResponse();
            response.setCode(404);
            response.setMimeType("text/plain");
            response.setStringBody("Couldn't read file: " + filePath);
            return response;
        }
        if (contentType.equals("application/json"))
        {
            boolean validatedJson = false;
            InputStream responseStream = SmartMockFileUtility.open(context, filePath);
            String result = null;
            if (responseStream != null)
            {
                result = SmartMockFileUtility.readFromInputStream(responseStream);
                if (result != null)
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
                    validatedJson = exceptionCount < 2;
                }
            }
            if (!validatedJson)
            {
                SmartMockResponse response = new SmartMockResponse();
                response.setCode(500);
                response.setMimeType("text/plain");
                response.setStringBody("Couldn't parse JSON of file: " + filePath);
                return response;
            }
            SmartMockResponse response = new SmartMockResponse();
            response.setCode(responseCode);
            response.setMimeType(contentType);
            response.getHeaders().overwriteHeaders(headers);
            response.setBody(SmartMockResponseBody.createFromString(result));
            return response;
        }
        SmartMockResponse response = new SmartMockResponse();
        response.setCode(responseCode);
        response.setMimeType(contentType);
        response.getHeaders().overwriteHeaders(headers);
        if (SmartMockFileUtility.isAssetFile(filePath))
        {
            response.setBody(SmartMockResponseBody.createFromAsset(context.getAssets(), SmartMockFileUtility.getRawPath(filePath), fileLength));
        }
        else
        {
            response.setBody(SmartMockResponseBody.createFromFile(SmartMockFileUtility.getRawPath(filePath), fileLength));
        }
        return response;
    }

    private static SmartMockResponse responseFromFileGenerator(Context context, String requestPath, String filePath, Map<String, String> getParameters, SmartMockProperties properties)
    {
        // Check if the request path points to a file deeper in the tree of the file path
        if (requestPath.startsWith("/"))
        {
            requestPath = requestPath.substring(1);
        }
        String[] requestPathComponents = requestPath.split("/");
        String[] filePathComponents = filePath.split("/");
        String requestFile = "";
        if (requestPathComponents.length > 0 && requestPathComponents[0].length() > 0)
        {
            for (int i = 0; i < filePathComponents.length; i++)
            {
                if (filePathComponents[i].equals(requestPathComponents[0]))
                {
                    int overlapComponents = filePathComponents.length - i;
                    for (int j = 0; j < overlapComponents; j++)
                    {
                        if (j < requestPathComponents.length && requestPathComponents[j].equals(filePathComponents[i + j]))
                        {
                            if (j == overlapComponents - 1)
                            {
                                String[] slicedComponents = Arrays.copyOfRange(requestPathComponents, overlapComponents, requestPathComponents.length);
                                requestFile = TextUtils.join("/", slicedComponents);
                            }
                        }
                        else
                        {
                            break;
                        }
                    }
                    if (requestFile.length() > 0)
                    {
                        break;
                    }
                }
            }
        }

        // Serve a file when pointing to a file within the file server
        if (!requestFile.isEmpty())
        {
            String serveFile = filePath + "/" + requestFile;
            SmartMockResponse response = new SmartMockResponse();
            if (SmartMockFileUtility.exists(context, serveFile))
            {
                response.setCode(200);
                response.setMimeType(getMimeType(serveFile));
                if (SmartMockFileUtility.isAssetFile(serveFile))
                {
                    response.setBody(SmartMockResponseBody.createFromAsset(context.getAssets(), SmartMockFileUtility.getRawPath(serveFile), SmartMockFileUtility.getLength(context, serveFile)));
                }
                else
                {
                    response.setBody(SmartMockResponseBody.createFromFile(SmartMockFileUtility.getRawPath(serveFile), SmartMockFileUtility.getLength(context, serveFile)));
                }
            }
            else
            {
                response.setCode(404);
                response.setMimeType("text/plain");
                response.setStringBody("Unable to read file: " + requestFile);
            }
            return response;
        }

        // Generate file list as JSON
        if (properties.isGeneratesJson() || getParameters.get("generatesJson") != null)
        {
            String[] files = SmartMockFileUtility.recursiveList(context, filePath);
            if (files == null)
            {
                return null;
            }
            SmartMockResponse response = new SmartMockResponse();
            if (properties.isIncludeMD5() || getParameters.get("includeMD5") != null)
            {
                String jsonString = "{";
                boolean firstFile = true;
                for (String file : files)
                {
                    if (!file.equals("properties.json"))
                    {
                        String md5 = SmartMockFileUtility.obtainMD5(context, filePath + "/" + file);
                        if (!firstFile)
                        {
                            jsonString += ", ";
                        }
                        jsonString += "\"" + file + "\": \"" + md5 + "\"";
                        firstFile = false;
                    }
                }
                jsonString += "}";
                response.setCode(200);
                response.setMimeType("application/json");
                response.setStringBody(jsonString);
            }
            else
            {
                String jsonString = "[";
                boolean firstFile = true;
                for (String file : files)
                {
                    if (!file.equals("properties.json"))
                    {
                        if (!firstFile)
                        {
                            jsonString += ", ";
                        }
                        jsonString += "\"" + file + "\"";
                        firstFile = false;
                    }
                }
                jsonString += "]";
                response.setCode(200);
                response.setMimeType("application/json");
                response.setStringBody(jsonString);
            }
            return response;
        }

        // Generated index page as HTML not supported in mock libraries, return nil
        return null;
    }

    private static String getMimeType(String filename)
    {
        String extension = "";
        if (filename != null)
        {
            int dotPos = filename.lastIndexOf(".");
            if (dotPos >= 0)
            {
                extension = filename.substring(dotPos + 1);
            }
        }
        if (extension.equals("png"))
        {
            return "image/png";
        }
        else if (extension.equals("gif"))
        {
            return "image/gif";
        }
        else if (extension.equals("jpg") || extension.equals("jpeg"))
        {
            return "image/jpg";
        }
        else if (extension.equals("htm") || extension.equals("html"))
        {
            return "text/html";
        }
        else if (extension.equals("zip"))
        {
            return "application/zip";
        }
        return "text/plain";
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
