package com.crescentflare.smartmockexample.data;

/**
 * Data model: a service belonging to the logged in user
 */
public class Service
{
    /**
     * Members
     */

    private String id;
    private String name;
    private String description;
    private Float price;


    /**
     * Generated code
     */

    public String getId()
    {
        return id;
    }

    public void setId(String id)
    {
        this.id = id;
    }

    public String getName()
    {
        return name;
    }

    public void setName(String name)
    {
        this.name = name;
    }

    public String getDescription()
    {
        return description;
    }

    public void setDescription(String description)
    {
        this.description = description;
    }

    public Float getPrice()
    {
        return price;
    }

    public void setPrice(Float price)
    {
        this.price = price;
    }

    @Override
    public String toString()
    {
        return "Product{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", description='" + description + '\'' +
                ", price=" + price +
                '}';
    }
}
