package com.crescentflare.smartmockexample.network;

import com.crescentflare.smartmock.SmartMockServer;
import com.crescentflare.smartmockexample.ExampleApplication;
import com.crescentflare.smartmockexample.data.ApiError;
import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.UnsupportedEncodingException;

import okhttp3.Interceptor;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Protocol;
import okhttp3.Response;
import okhttp3.ResponseBody;

/**
 * Network interceptor: hooks the mock library into okhttp as an interceptor
 */
public class MockInterceptor implements Interceptor
{
    private String fromUrl = "";
    private String toMockUrl = "";

    public MockInterceptor(String fromUrl, String toMockUrl)
    {
        if (fromUrl != null)
        {
            this.fromUrl = fromUrl;
        }
        if (toMockUrl != null)
        {
            this.toMockUrl = toMockUrl;
        }
    }

    @Override
    public Response intercept(Chain chain) throws IOException
    {
        String path = chain.request().url().toString().replace(fromUrl, "");
        String responseBody = SmartMockServer.obtainResponse(ExampleApplication.context, toMockUrl, path);
        if (responseBody != null)
        {
            return new Response.Builder().request(chain.request()).protocol(Protocol.HTTP_1_1).body(ResponseBody.create(MediaType.parse("application/json"), responseBody)).code(200).build();
        }
        return new Response.Builder().request(chain.request()).protocol(Protocol.HTTP_1_1).body(ResponseBody.create(MediaType.parse("application/json"), "")).code(404).build();
    }
}
