package com.crescentflare.smartmock.utility;

import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Assert;
import org.junit.Test;

/**
 * Utility test: parameter matching cases
 */
public class SmartMockParamMatcherTest
{
    /**
     * Test cases
     */

    @Test
    public void testParamEquals() throws Exception
    {
        Assert.assertTrue(SmartMockParamMatcher.paramEquals("username", "username"));
        Assert.assertFalse(SmartMockParamMatcher.paramEquals("username", "username10"));
        Assert.assertTrue(SmartMockParamMatcher.paramEquals("*name", "username"));
        Assert.assertFalse(SmartMockParamMatcher.paramEquals("*not", "username"));
        Assert.assertTrue(SmartMockParamMatcher.paramEquals("*@*", "user@mail"));
        Assert.assertTrue(SmartMockParamMatcher.paramEquals("user??*@*.*", "user10ex@mail.com"));
        Assert.assertFalse(SmartMockParamMatcher.paramEquals("user??*@*.*", "user4@mail.com"));
        Assert.assertTrue(SmartMockParamMatcher.paramEquals("user??*@*.*", "user42@mail.com"));
    }

    @Test
    public void testDeepEquals() throws Exception
    {
        Assert.assertTrue(SmartMockParamMatcher.deepEquals(
                makeObject("{ 'username': 'username' }"),
                makeObject("{ 'username': 'username', 'extra': 'value' }")
        ));
        Assert.assertTrue(SmartMockParamMatcher.deepEquals(
                makeObject("{ 'username': 'username', 'info': { 'name': '*', 'role': 'admin' } }"),
                makeObject("{ 'username': 'username', 'info': { 'name': 'test', 'role': 'admin' } }")
        ));
        Assert.assertFalse(SmartMockParamMatcher.deepEquals(
                makeObject("{ 'username': 'username', 'info': { 'name': '*', 'role': 'admin' } }"),
                makeObject("{ 'username': 'username', 'info': { 'role': 'admin' } }")
        ));
    }


    /**
     * Helper
     */

    private JSONObject makeObject(String jsonString)
    {
        jsonString = jsonString.replaceAll("'", "\"");
        try
        {
            return new JSONObject(jsonString);
        }
        catch (JSONException ignored)
        {
        }
        return new JSONObject();
    }
}
