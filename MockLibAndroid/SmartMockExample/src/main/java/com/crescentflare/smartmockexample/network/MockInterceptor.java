package com.crescentflare.smartmockexample.network;

import com.crescentflare.smartmock.SmartMockResponse;
import com.crescentflare.smartmock.SmartMockServer;
import com.crescentflare.smartmockexample.ExampleApplication;

import java.io.IOException;
import java.nio.charset.Charset;

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
        // Obtain path and body
        String path = chain.request().url().toString().replace(fromUrl, "");
        String body = null;
        if (chain.request().body() != null)
        {
            Buffer buffer = new Buffer();
            chain.request().body().writeTo(buffer);
            body = buffer.readString(Charset.forName("UTF-8"));
        }

        // Generate mock response
        SmartMockResponse response = SmartMockServer.obtainResponse(ExampleApplication.context, chain.request().method(), toMockUrl, path, body);
        if (response != null)
        {
            return new Response.Builder().request(chain.request()).protocol(Protocol.HTTP_1_1).body(ResponseBody.create(MediaType.parse("application/json"), response.getBody())).code(200).build();
        }
        return new Response.Builder().request(chain.request()).protocol(Protocol.HTTP_1_1).body(ResponseBody.create(MediaType.parse("text/plain"), "")).code(404).build();
    }
}
