using UnityEngine;
using UnityEngine.SceneManagement;

public class SceneController : MonoBehaviour
{
    Scene currentScene;

    private void Awake()
    {
        // ���� �� ������ �޾ƿ´�. 
        currentScene = SceneManager.GetActiveScene();
    }

    //�� �̵��� ����ϴ� �Լ��̴�.
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
