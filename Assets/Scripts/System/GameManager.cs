using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager instance;

    [SerializeField] protected UIManager UIManager;
    [SerializeField] protected AudioManager AudioManager;

    public bool isLive;
    public bool currentDate;
    public bool maxDate;

    private void Awake()
    {
        if(instance == null)
        {
            instance = this;
        }
        else
        {
            Destroy(gameObject);
        }
    }

    void Start()
    {
        
    }

    void Update()
    {
        
    }
}
