package com.jhipsterangular.test.cucumber.stepdefs;

import com.jhipsterangular.test.JhipsterAngular4App;

import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.ResultActions;

import org.springframework.boot.test.context.SpringBootTest;

@WebAppConfiguration
@SpringBootTest
@ContextConfiguration(classes = JhipsterAngular4App.class)
public abstract class StepDefs {

    protected ResultActions actions;

}
