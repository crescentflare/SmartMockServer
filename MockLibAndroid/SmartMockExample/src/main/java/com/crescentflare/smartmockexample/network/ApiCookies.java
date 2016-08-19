package com.crescentflare.smartmockexample.network;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import okhttp3.Cookie;
import okhttp3.CookieJar;
import okhttp3.HttpUrl;

/**
 * Network storage: stores cookies while the app is running
 */
public class ApiCookies implements CookieJar
{
    private List<Cookie> cookies;

    @Override
    public void saveFromResponse(HttpUrl url, List<Cookie> cookies)
    {
        this.cookies = cookies;
    }

    @Override
    public List<Cookie> loadForRequest(HttpUrl url)
    {
        if (cookies != null)
        {
            return cookies;
        }
        return new ArrayList<>();
    }

    public void applyFromHeaders(Map<String, List<String>> headers)
    {
        for (String key : headers.keySet())
        {
            if (key.equalsIgnoreCase("Set-Cookie"))
            {
                cookies = new ArrayList<>();
                for (String cookie : headers.get(key))
                {
                    String[] valueSet = cookie.split("=");
                    if (valueSet.length > 1)
                    {
                        cookies.add(new Cookie.Builder().name(valueSet[0]).value(valueSet[1]).domain("dummy.mck").build());
                    }
                    else
                    {
                        cookies.add(new Cookie.Builder().name(valueSet[0]).domain("dummy.mck").build());
                    }
                }
                break;
            }
        }
    }

    public Map<String, List<String>> convertToHeaders()
    {
        if (cookies != null && cookies.size() > 0)
        {
            List<String> cookieValues = new ArrayList<>();
            for (Cookie cookie : cookies)
            {
                String addValue = cookie.name();
                if (cookie.value() != null && cookie.value().length() > 0)
                {
                    addValue += "=" + cookie.value();
                }
                cookieValues.add(addValue);
            }
            Map<String, List<String>> result = new HashMap<>();
            result.put("Cookie", cookieValues);
            return result;
        }
        return null;
    }

    public void clear()
    {
        cookies = null;
    }
}
