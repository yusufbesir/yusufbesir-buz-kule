// Ghidra betiği: tüm fonksiyonları C sözde koduna döker. Sahip: Claude (Icy Tower klonu iş parçacığı). Salt okunur.
import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.*;
import ghidra.program.model.listing.*;
import java.io.*;

public class DumpDecomp extends GhidraScript {
  @Override
  public void run() throws Exception {
    String[] a = getScriptArgs();
    File out = new File(a[0]);
    DecompInterface di = new DecompInterface();
    di.openProgram(currentProgram);
    int n = 0, ok = 0;
    try (PrintWriter w = new PrintWriter(new FileWriter(out))) {
      for (Function f : currentProgram.getFunctionManager().getFunctions(true)) {
        n++;
        DecompileResults r = di.decompileFunction(f, 30, monitor);
        if (r.decompileCompleted()) {
          ok++;
          w.println("// ==== " + f.getName() + " @ " + f.getEntryPoint() + " size=" + f.getBody().getNumAddresses());
          w.println(r.getDecompiledFunction().getC());
        }
      }
    }
    println("FUNC_TOTAL=" + n + " DECOMPILED=" + ok);
  }
}
