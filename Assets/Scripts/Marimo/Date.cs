using UnityEngine;

public class Date : MonoBehaviour
{
    protected int currentDate;
    protected int maxDate;

    void Start()
    {
        maxDate = 7;
    }
    
    public void setCurDate()
    {
        currentDate = maxDate--;
    }

}
