package com.crescentflare.smartmockexample.network;

import com.crescentflare.smartmock.model.SmartMockResponse;
import com.crescentflare.smartmock.SmartMockServer;
import com.crescentflare.smartmockexample.ExampleApplication;

import java.io.IOException;
import java.nio.charset.Charset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import okhttp3.Headers;
import okhttp3.Interceptor;
import okhttp3.MediaType;
import okhttp3.Protocol;
import okhttp3.Response;
import okhttp3.ResponseBody;
import okio.Buffer;

/**
 * Network interceptor: hooks the mock library into okhttp as an interceptor
 */
public class MockInterceptor implements Interceptor
{
    private String fromUrl = "";
    private String toMockUrl = "";
    private String cookie = null;

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

    public void clearCookies()
    {
        cookie = null;
    }

    @Override
    public Response intercept(Chain chain) throws IOException
    {
        // Obtain path and body
        String path = chain.request().url().toString().replace(fromUrl, "");
        String body = null;
        if (chain.request().body() != null)
        {
            Buffer buffer = new Buffer();
            chain.request().body().writeTo(buffer);
            body = buffer.readString(Charset.forName("UTF-8"));
        }

        // Collect headers
        Map<String, List<String>> headerMap = chain.request().headers().toMultimap();
        Map<String, String> sendHeaders = new HashMap<>();
        for (String key : headerMap.keySet())
        {
            String headerValue = "";
            for (String value : headerMap.get(key))
            {
                if (headerValue.length() > 0)
                {
                    headerValue += "; ";
                }
                headerValue += value;
            }
            sendHeaders.put(key, headerValue);
        }
        if (cookie != null)
        {
            sendHeaders.put("Cookie", cookie);
        }

        // Generate mock response
        SmartMockResponse response = SmartMockServer.obtainResponse(ExampleApplication.context, chain.request().method(), toMockUrl, path, body, sendHeaders);
        if (response != null)
        {
            Headers.Builder headersBuilder = new Headers.Builder();
            for (String key : response.getHeaders().keySet())
            {
                headersBuilder.add(key, response.getHeaders().get(key));
            }
            Headers headers = headersBuilder.build();
            for (String key : response.getHeaders().keySet())
            {
                if (key.equalsIgnoreCase("Set-Cookie"))
                {
                    cookie = response.getHeaders().get(key);
                    break;
                }
            }
            return new Response.Builder().request(chain.request()).protocol(Protocol.HTTP_1_1).body(ResponseBody.create(MediaType.parse(response.getMimeType()), response.getBody())).code(response.getCode()).headers(headers).build();
        }
        return new Response.Builder().request(chain.request()).protocol(Protocol.HTTP_1_1).body(ResponseBody.create(MediaType.parse("text/plain"), "")).code(404).build();
    }
}
