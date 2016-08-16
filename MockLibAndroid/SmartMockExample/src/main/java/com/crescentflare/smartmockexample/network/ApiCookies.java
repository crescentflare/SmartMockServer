package com.crescentflare.smartmockexample.network;

import java.util.ArrayList;
import java.util.List;

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

    public void clear()
    {
        cookies = null;
    }
}
