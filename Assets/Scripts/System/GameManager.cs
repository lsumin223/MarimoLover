using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager instance;

    [SerializeField] protected UIManager UIManager;
    [SerializeField] protected AudioManager AudioManager;

    [SerializeField] protected Date Date;
    [SerializeField] protected Schedule Schedule;

    public bool isLive;

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
        if(!isLive)
        {
            Gameover();
            return;
        }
    }

    void Gameover()
    {

    }
}
