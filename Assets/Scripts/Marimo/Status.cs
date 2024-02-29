using UnityEngine;

public class Status
{
    public string name { get; set; }
    public int a { get; set; }
    public int b { get; set; }
    public int c { get; set; }
    public int d { get; set; }

    const int MAXVALUE = 5; //½ºÅİ ÃÖ´ë°ªÀ» 5·Î µĞ´Ù.

    public Status(string name, int a, int b, int c, int d)
    {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }


}
