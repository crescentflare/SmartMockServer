package com.crescentflare.smartmock.model;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * Smart mock library model: a properties model
 */
public class SmartMockProperties
{
    /**
     * Members
     */

    private Map<String, String> getParameters = null;
    private Map<String, String> postParameters = null;
    private Map<String, String> checkHeaders = null;
    private JSONObject postJson = null;
    private List<SmartMockProperties> alternatives = null;
    private String name = null;
    private String method = null;
    private String responsePath = null;
    private String generates = null;
    private String redirect = null;
    private String replaceToken = null;
    private int delay = -1;
    private int responseCode = -1;
    private boolean generatesJson = false;
    private boolean includeSHA256 = false;


    /**
     * Serialization
     */

    public void parseJson(JSONObject jsonObject)
    {
        // Parse parameters, body and header filters
        getParameters = serializeJsonStringMap(jsonObject, "getParameters");
        postParameters = serializeJsonStringMap(jsonObject, "postParameters");
        checkHeaders = serializeJsonStringMap(jsonObject, "checkHeaders");
        postJson = jsonObject.optJSONObject("postJson");

        // Parse alternatives
        JSONArray alternativesJson = jsonObject.optJSONArray("alternatives");
        if (alternativesJson != null)
        {
            alternatives = new ArrayList<>();
            for (int i = 0; i < alternativesJson.length(); i++)
            {
                JSONObject propertiesJson = alternativesJson.optJSONObject(i);
                if (propertiesJson != null)
                {
                    SmartMockProperties addProperties = new SmartMockProperties();
                    addProperties.parseJson(propertiesJson);
                    alternatives.add(addProperties);
                }
            }
        }

        // Parse basic fields
        name = jsonObject.optString("name", null);
        method = jsonObject.optString("method", null);
        responsePath = jsonObject.optString("responsePath", null);
        generates = jsonObject.optString("generates", null);
        redirect = jsonObject.optString("redirect", null);
        replaceToken = jsonObject.optString("replaceToken", null);
        delay = jsonObject.optInt("delay", -1);
        responseCode = jsonObject.optInt("responseCode", -1);
        generatesJson = jsonObject.optBoolean("generatesJson", false);
        includeSHA256 = jsonObject.optBoolean("includeSHA256", false);
    }

    public void fallbackToProperties(SmartMockProperties fallbackProperties)
    {
        // Parameters, body and header filters
        if (getParameters == null)
        {
            getParameters = fallbackProperties.getGetParameters();
        }
        if (postParameters == null)
        {
            postParameters = fallbackProperties.getPostParameters();
        }
        if (checkHeaders == null)
        {
            checkHeaders = fallbackProperties.getCheckHeaders();
        }
        if (postJson == null)
        {
            postJson = fallbackProperties.getPostJson();
        }

        // Alternatives
        if (alternatives == null)
        {
            alternatives = fallbackProperties.getAlternatives();
        }

        // Basic fields
        if (name == null)
        {
            name = fallbackProperties.getName();
        }
        if (method == null)
        {
            method = fallbackProperties.getMethod();
        }
        if (responsePath == null)
        {
            responsePath = fallbackProperties.getResponsePath();
        }
        if (generates == null)
        {
            generates = fallbackProperties.getGenerates();
        }
        if (redirect == null)
        {
            redirect = fallbackProperties.getRedirect();
        }
        if (replaceToken == null)
        {
            replaceToken = fallbackProperties.getReplaceToken();
        }
        if (delay < 0)
        {
            delay = fallbackProperties.getDelay();
        }
        if (responseCode < 0)
        {
            responseCode = fallbackProperties.getResponseCode();
        }
        if (!generatesJson)
        {
            generatesJson = fallbackProperties.isGeneratesJson();
        }
        if (!includeSHA256)
        {
            includeSHA256 = fallbackProperties.isIncludeSHA256();
        }
    }


    /**
     * Helpers
     */

    public void forceDefaults()
    {
        responseCode = responseCode >= 0 ? responseCode : 200;
        responsePath = responsePath != null ? responsePath : "response";
    }

    private Map<String, String> serializeJsonStringMap(JSONObject jsonObject, String mapKey)
    {
        JSONObject mapJson = jsonObject.optJSONObject(mapKey);
        if (mapJson != null)
        {
            Map<String, String> result = new HashMap<>();
            Iterator<String> keys = mapJson.keys();
            while (keys.hasNext())
            {
                String key = keys.next();
                result.put(key, mapJson.optString(key, ""));
            }
            return result;
        }
        return null;
    }


    /**
     * Generated code
     */

    public Map<String, String> getGetParameters()
    {
        return getParameters;
    }

    public void setGetParameters(Map<String, String> getParameters)
    {
        this.getParameters = getParameters;
    }

    public Map<String, String> getPostParameters()
    {
        return postParameters;
    }

    public void setPostParameters(Map<String, String> postParameters)
    {
        this.postParameters = postParameters;
    }

    public Map<String, String> getCheckHeaders()
    {
        return checkHeaders;
    }

    public void setCheckHeaders(Map<String, String> checkHeaders)
    {
        this.checkHeaders = checkHeaders;
    }

    public JSONObject getPostJson()
    {
        return postJson;
    }

    public void setPostJson(JSONObject postJson)
    {
        this.postJson = postJson;
    }

    public List<SmartMockProperties> getAlternatives()
    {
        return alternatives;
    }

    public void setAlternatives(List<SmartMockProperties> alternatives)
    {
        this.alternatives = alternatives;
    }

    public String getName()
    {
        return name;
    }

    public void setName(String name)
    {
        this.name = name;
    }

    public String getMethod()
    {
        return method;
    }

    public void setMethod(String method)
    {
        this.method = method;
    }

    public String getResponsePath()
    {
        return responsePath;
    }

    public void setResponsePath(String responsePath)
    {
        this.responsePath = responsePath;
    }

    public String getGenerates()
    {
        return generates;
    }

    public void setGenerates(String generates)
    {
        this.generates = generates;
    }

    public String getRedirect()
    {
        return redirect;
    }

    public void setRedirect(String redirect)
    {
        this.redirect = redirect;
    }

    public String getReplaceToken()
    {
        return replaceToken;
    }

    public void setReplaceToken(String replaceToken)
    {
        this.replaceToken = replaceToken;
    }

    public int getDelay()
    {
        return delay;
    }

    public void setDelay(int delay)
    {
        this.delay = delay;
    }

    public int getResponseCode()
    {
        return responseCode;
    }

    public void setResponseCode(int responseCode)
    {
        this.responseCode = responseCode;
    }

    public boolean isGeneratesJson()
    {
        return generatesJson;
    }

    public void setGeneratesJson(boolean generatesJson)
    {
        this.generatesJson = generatesJson;
    }

    public boolean isIncludeSHA256()
    {
        return includeSHA256;
    }

    public void setIncludeSHA256(boolean includeSHA256)
    {
        this.includeSHA256 = includeSHA256;
    }

    @Override
    public String toString()
    {
        return "SmartMockProperties{" +
                "getParameters=" + getParameters +
                ", postParameters=" + postParameters +
                ", checkHeaders=" + checkHeaders +
                ", postJson=" + postJson +
                ", alternatives=" + alternatives +
                ", name='" + name + '\'' +
                ", method='" + method + '\'' +
                ", responsePath='" + responsePath + '\'' +
                ", generates='" + generates + '\'' +
                ", redirect='" + redirect + '\'' +
                ", replaceToken='" + replaceToken + '\'' +
                ", delay=" + delay +
                ", responseCode=" + responseCode +
                ", generatesJson=" + generatesJson +
                ", includeSHA256=" + includeSHA256 +
                '}';
    }
}
