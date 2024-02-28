using UnityEngine;
using UnityEngine.SceneManagement;

public class SceneController : MonoBehaviour
{
    Scene currentScene;

    private void Awake()
    {
        // 현재 씬 정보를 받아온다. 
        currentScene = SceneManager.GetActiveScene();
    }

    //씬 이동을 담당하는 함수이다.
    public void MoveNextStage() 
    {
        switch(currentScene.name)
        {
            case "Title":
                SceneManager.LoadScene("Tutorial");
                break;
            case "Tutorial":
                SceneManager.LoadScene("Ingame");
                break;
            case "Ingame":
                SceneManager.LoadScene("Ending");
                break;
        }
    }
}
