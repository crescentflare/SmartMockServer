package com.crescentflare.smartmockexample.data;

/**
 * Data model: a logged in user
 */
public class User
{
    /**
     * Members
     */

    private String username;
    private UserRole role;


    /**
     * Generated code
     */

    public String getUsername()
    {
        return username;
    }

    public void setUsername(String username)
    {
        this.username = username;
    }

    public UserRole getRole()
    {
        return role;
    }

    public void setRole(UserRole role)
    {
        this.role = role;
    }

    @Override
    public String toString()
    {
        return "User{" +
                "username='" + username + '\'' +
                ", role=" + role +
                '}';
    }
}
