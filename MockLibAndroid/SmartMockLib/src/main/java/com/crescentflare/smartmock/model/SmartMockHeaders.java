package com.crescentflare.smartmock.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Smart mock library model: a set of headers
 */
public class SmartMockHeaders
{
    /**
     * Members
     */

    private Map<String, List<String>> values = new HashMap<>();


    /**
     * Initialization
     */

    private SmartMockHeaders()
    {
        // Private constructor, use factory methods to create an instance
    }

    public static SmartMockHeaders create(Map<String, List<String>> headers)
    {
        SmartMockHeaders result = new SmartMockHeaders();
        if (headers != null)
        {
            result.values = headers;
        }
        return result;
    }

    public static SmartMockHeaders createFromFlattenedMap(Map<String, String> headers)
    {
        SmartMockHeaders result = new SmartMockHeaders();
        if (headers != null)
        {
            for (String key : headers.keySet())
            {
                List<String> list = new ArrayList<>();
                list.add(headers.get(key));
                result.values.put(key, list);
            }
        }
        return result;
    }


    /**
     * Access headers
     */

    public Map<String, List<String>> getHeaderMap()
    {
        return values;
    }

    public void overwriteHeaders(SmartMockHeaders headers)
    {
        for (String key : headers.getHeaderMap().keySet())
        {
            setHeader(key, headers.getHeaderValue(key));
        }
    }

    public String getHeaderValue(String key)
    {
        for (String checkKey : values.keySet())
        {
            if (checkKey.equalsIgnoreCase(key))
            {
                String result = "";
                for (String value : values.get(checkKey))
                {
                    if (result.length() > 0)
                    {
                        result += "; ";
                    }
                    result += value;
                }
                return result;
            }
        }
        return null;
    }

    public void setHeader(String key, String value)
    {
        List<String> list = new ArrayList<>();
        list.add(value);
        removeHeader(key);
        values.put(key, list);
    }

    public void addHeader(String key, String value)
    {
        for (String checkKey : values.keySet())
        {
            if (checkKey.equalsIgnoreCase(key))
            {
                values.get(checkKey).add(value);
                return;
            }
        }
        setHeader(key, value);
    }

    public void removeHeader(String key)
    {
        for (String checkKey : values.keySet())
        {
            if (checkKey.equalsIgnoreCase(key))
            {
                values.remove(checkKey);
                return;
            }
        }
    }
}
