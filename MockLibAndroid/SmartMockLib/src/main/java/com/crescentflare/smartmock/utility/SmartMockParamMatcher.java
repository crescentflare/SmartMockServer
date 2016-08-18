package com.crescentflare.smartmock.utility;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;

/**
 * Smart mock library utility: match parameters with wildcard support
 */
public class SmartMockParamMatcher
{
    /**
     * Private constructor, only static methods allowed
     */

    private SmartMockParamMatcher()
    {
    }


    /**
     * String or JSON matching
     */

    public static boolean deepEquals(JSONObject requireObject, JSONObject haveObject)
    {
        List<String> wantKeys = new ArrayList<>();
        Iterator<String> requireObjIterator = requireObject.keys();
        while (requireObjIterator.hasNext())
        {
            wantKeys.add(requireObjIterator.next());
        }
        for (String key : wantKeys)
        {
            if (!haveObject.has(key))
            {
                return false;
            }
            else if (haveObject.opt(key) instanceof JSONObject && requireObject.opt(key) instanceof JSONObject)
            {
                if (!deepEquals(requireObject.optJSONObject(key), haveObject.optJSONObject(key)))
                {
                    return false;
                }
            }
            else if (!paramEquals(requireObject.optString(key, ""), haveObject.optString(key, "")))
            {
                return false;
            }
        }
        return true;
    }

    public static boolean paramEquals(String requireParam, String haveParam)
    {
        if (haveParam == null)
        {
            return false;
        }
        String[] patternSet = requireParam.split("\\*", -1);
        if (patternSet.length == 0)
        {
            return true;
        }
        if (patternSet[0].length() > 0 && !patternEquals(safeSubstring(haveParam, 0, patternSet[0].length()), patternSet[0]))
        {
            return false;
        }
        return searchPatternSet(haveParam, patternSet) >= 0;
    }


    /**
     * Internal pattern matching
     */

    private static int searchPatternSet(String value, String[] patternSet)
    {
        while (patternSet.length > 0 && patternSet[0].length() == 0)
        {
            patternSet = Arrays.copyOfRange(patternSet, 1, patternSet.length);
        }
        if (patternSet.length == 0)
        {
            return 0;
        }
        int startPos = 0, pos;
        boolean searching;
        do
        {
            searching = false;
            pos = searchPattern(safeSubstring(value, startPos), patternSet[0]);
            if (pos >= 0)
            {
                if (patternSet.length == 1)
                {
                    if (startPos + pos + patternSet[0].length() == value.length())
                    {
                        return startPos + pos;
                    }
                }
                else
                {
                    int nextPos = startPos + pos + patternSet[0].length();
                    int setPos = searchPatternSet(safeSubstring(value, nextPos), Arrays.copyOfRange(patternSet, 1, patternSet.length));
                    if (setPos >= 0)
                    {
                        return startPos + pos;
                    }
                }
                startPos += pos + 1;
                searching = true;
            }
        }
        while (searching);
        return -1;
    }

    private static int searchPattern(String value, String pattern)
    {
        if (pattern.length() == 0)
        {
            return 0;
        }
        for (int i = 0; i < value.length(); i++)
        {
            if (pattern.charAt(0) == '?' || value.charAt(i) == pattern.charAt(0))
            {
                if (patternEquals(safeSubstring(value, i, i + pattern.length()), pattern))
                {
                    return i;
                }
            }
        }
        return -1;
    }

    private static boolean patternEquals(String value, String pattern)
    {
        if (value.length() != pattern.length())
        {
            return false;
        }
        for (int i = 0; i < pattern.length(); i++)
        {
            if (pattern.charAt(i) != '?' && value.charAt(i) != pattern.charAt(i))
            {
                return false;
            }
        }
        return true;
    }

    /**
     * String helper
     */

    private static String safeSubstring(String string, int start)
    {
        if (start > string.length())
        {
            return "";
        }
        return string.substring(start);
    }

    private static String safeSubstring(String string, int start, int end)
    {
        if (start > string.length())
        {
            start = string.length();
        }
        if (end > string.length())
        {
            end = string.length();
        }
        if (end <= start)
        {
            return "";
        }
        return string.substring(start, end);
    }
}
