package com.intellij.ide.actions;

import com.intellij.openapi.actionSystem.AnAction;
import com.intellij.openapi.actionSystem.AnActionEvent;
import com.intellij.openapi.help.HelpManager;
import com.intellij.openapi.project.DumbAware;

public class HelpTopicsAction extends AnAction implements DumbAware {
  public void actionPerformed(AnActionEvent e) {
    HelpManager.getInstance().invokeHelp("top");
  }
}
